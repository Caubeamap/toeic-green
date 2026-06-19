import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { pruneExpiredEntries } from '../../common/utils/prune-expired-cache';
import { CreateCommentDto } from './dto/create-comment.dto';

/* ──────────────────────────── Constants ──────────────────────────────────── */

const COUNT_CACHE_TTL_MS = 30_000;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const DEFAULT_REPLY_PREVIEW_LIMIT = 3;
const MAX_REPLY_PREVIEW_LIMIT = 5;
const DEFAULT_REPLY_LIMIT = 10;
const MAX_REPLY_LIMIT = 20;

/* ──────────────────────────── Interfaces ─────────────────────────────────── */

export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface CommentNode {
  id: string;
  parentId: string | null;
  depth: number;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: CommentAuthor;
  replyCount: number;
  repliesNextCursor: string | null;
  replies: CommentNode[];
}

export interface CommentFeed {
  comments: CommentNode[];
  nextCursor: string | null;
  totalCount: number;
}

export interface CommentRepliesPage {
  replies: CommentNode[];
  nextCursor: string | null;
  totalCount: number;
}

/* ──────────────────────────── Internal types ─────────────────────────────── */

/** Shape returned by prisma.testComment queries with the select used below */
interface CommentRow {
  id: bigint;
  parentId: bigint | null;
  depth: number;
  content: string;
  isPinned: boolean;
  createdAt: Date;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface RawCommentRow {
  id: bigint;
  parent_id: bigint | null;
  depth: number;
  content: string;
  is_pinned: boolean;
  created_at: Date;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

/** Shape of a row entry in the countCache Map */
interface CountCacheEntry {
  expiresAt: number;
  value: number;
}

/* ─────────────────────────────────────────────────────────────────────────── */

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** in-memory totalCount cache; keyed by String(testId) for pruneExpiredEntries compat */
  private countCache = new Map<string, CountCacheEntry>();

  private readonly commentSelect = {
    id: true,
    parentId: true,
    depth: true,
    content: true,
    isPinned: true,
    createdAt: true,
    user: {
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
      },
    },
  } as const;

  /* ──────────────────────────── Public: create ─────────────────────────── */

  async create(
    userId: string,
    slug: string,
    dto: CreateCommentDto,
  ): Promise<CommentNode> {
    const testId = await this.resolveTestId(slug);

    let parentId: bigint | null = null;
    let rootId: bigint | null = null;
    let depth = 0;

    if (dto.parentId !== undefined) {
      const pid = this.parseId(dto.parentId);

      const parent = await this.prisma.testComment.findUnique({
        where: { id: pid },
        select: {
          id: true,
          testId: true,
          parentId: true,
          rootId: true,
          depth: true,
          deletedAt: true,
        },
      });

      if (!parent || parent.testId !== testId || parent.deletedAt !== null) {
        throw new BadRequestException('Bình luận gốc không hợp lệ.');
      }

      parentId = parent.id;
      // parent.parentId === null means parent is a root comment, so this reply's
      // root is the parent itself; otherwise inherit the parent's rootId.
      rootId = parent.parentId === null ? parent.id : parent.rootId;
      depth = parent.depth + 1;
    }

    const row = await this.prisma.testComment.create({
      data: {
        testId,
        userId,
        parentId,
        rootId,
        depth,
        content: dto.content,
      },
      select: {
        id: true,
        parentId: true,
        depth: true,
        content: true,
        isPinned: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.countCache.delete(String(testId));
    return this.toNode(row);
  }

  /* ──────────────────────────── Public: list ───────────────────────────── */

  async list(
    slug: string,
    opts: { cursor?: string; limit?: number; replyPreviewLimit?: number },
  ): Promise<CommentFeed> {
    const testId = await this.resolveTestId(slug);
    const limit = Math.min(Math.max(opts.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const replyPreviewLimit = Math.min(
      Math.max(opts.replyPreviewLimit ?? DEFAULT_REPLY_PREVIEW_LIMIT, 0),
      MAX_REPLY_PREVIEW_LIMIT,
    );
    const isFirstPage = !opts.cursor;

    /** Reusable select shape for all findMany calls */
    const select = {
      id: true,
      parentId: true,
      depth: true,
      content: true,
      isPinned: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    } as const;

    // (1) Pinned roots — first page only
    const pinnedRoots: CommentRow[] = isFirstPage
      ? await this.prisma.testComment.findMany({
          where: { testId, parentId: null, deletedAt: null, isPinned: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select,
        })
      : [];

    // (2) Cursor condition
    const cursorWhere = opts.cursor
      ? (() => {
          const c = this.decodeCursor(opts.cursor);
          return {
            OR: [
              { createdAt: { lt: c.createdAt } },
              { createdAt: c.createdAt, id: { lt: c.id } },
            ],
          };
        })()
      : {};

    // (3) Non-pinned root page
    const pageRoots: CommentRow[] = await this.prisma.testComment.findMany({
      where: {
        testId,
        parentId: null,
        deletedAt: null,
        isPinned: false,
        ...cursorWhere,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select,
    });

    const hasMore = pageRoots.length > limit;
    const visibleRoots = hasMore ? pageRoots.slice(0, limit) : pageRoots;
    const allRoots = [...pinnedRoots, ...visibleRoots];

    // (4) Build roots and attach a bounded preview of direct replies only.
    const rootNodes = allRoots.map((root) => this.toNode(root));
    const previewMap = await this.getDirectReplyPreviews(
      allRoots.map((root) => root.id),
      replyPreviewLimit,
    );

    const allVisibleNodes = [...rootNodes];
    for (const root of rootNodes) {
      const previewRows = previewMap.get(root.id) ?? [];
      root.replies = previewRows.map((row) => this.toNode(row));
      allVisibleNodes.push(...root.replies);
    }
    await this.hydrateReplyCounts(allVisibleNodes);
    for (const root of rootNodes) {
      root.repliesNextCursor =
        root.replies.length < root.replyCount && root.replies.length > 0
          ? this.encodeNodeCursor(root.replies[root.replies.length - 1])
          : null;
    }

    // (5) Next cursor
    const last = visibleRoots[visibleRoots.length - 1];
    const nextCursor = hasMore && last ? this.encodeCursor(last) : null;

    return {
      comments: rootNodes,
      nextCursor,
      totalCount: await this.getTotalCount(testId),
    };
  }

  async listReplies(
    slug: string,
    parentIdValue: string,
    opts: { cursor?: string; limit?: number },
  ): Promise<CommentRepliesPage> {
    const testId = await this.resolveTestId(slug);
    const parentId = this.parseId(parentIdValue);
    const limit = Math.min(
      Math.max(opts.limit ?? DEFAULT_REPLY_LIMIT, 1),
      MAX_REPLY_LIMIT,
    );

    const parent = await this.prisma.testComment.findUnique({
      where: { id: parentId },
      select: { id: true, testId: true, deletedAt: true },
    });

    if (!parent || parent.testId !== testId || parent.deletedAt !== null) {
      throw new BadRequestException('Bình luận không hợp lệ.');
    }

    const cursorWhere = opts.cursor
      ? (() => {
          const c = this.decodeCursor(opts.cursor);
          return {
            OR: [
              { createdAt: { gt: c.createdAt } },
              { createdAt: c.createdAt, id: { gt: c.id } },
            ],
          };
        })()
      : {};

    const rows = await this.prisma.testComment.findMany({
      where: {
        parentId,
        deletedAt: null,
        ...cursorWhere,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      select: this.commentSelect,
    });

    const hasMore = rows.length > limit;
    const visibleRows = hasMore ? rows.slice(0, limit) : rows;
    const replies = visibleRows.map((row) => this.toNode(row));
    await this.hydrateReplyCounts(replies);

    return {
      replies,
      nextCursor:
        hasMore && visibleRows.length > 0
          ? this.encodeCursor(visibleRows[visibleRows.length - 1])
          : null,
      totalCount: await this.prisma.testComment.count({
        where: { parentId, deletedAt: null },
      }),
    };
  }

  /* ─────────────────────────── Private helpers ─────────────────────────── */

  private async resolveTestId(slug: string): Promise<number> {
    const test = await this.prisma.test.findUnique({
      where: { slug },
      select: { id: true, isPublished: true },
    });

    if (!test || !test.isPublished) {
      throw new BadRequestException('Không tìm thấy đề thi.');
    }

    return test.id;
  }

  private parseId(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('parentId không hợp lệ');
    }
  }

  private toNode(row: CommentRow): CommentNode {
    return {
      id: row.id.toString(),
      parentId: row.parentId !== null ? row.parentId.toString() : null,
      depth: row.depth,
      content: row.content,
      isPinned: row.isPinned,
      createdAt: row.createdAt.toISOString(),
      author: {
        id: row.user.id,
        displayName: row.user.displayName,
        avatarUrl: row.user.avatarUrl,
      },
      replyCount: 0,
      repliesNextCursor: null,
      replies: [],
    };
  }

  private rawToRow(row: RawCommentRow): CommentRow {
    return {
      id: row.id,
      parentId: row.parent_id,
      depth: row.depth,
      content: row.content,
      isPinned: row.is_pinned,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      },
    };
  }

  private encodeCursor(row: { createdAt: Date; id: bigint }): string {
    return Buffer.from(
      `${row.createdAt.toISOString()}|${row.id.toString()}`,
    ).toString('base64url');
  }

  private encodeNodeCursor(
    node: Pick<CommentNode, 'createdAt' | 'id'>,
  ): string {
    return this.encodeCursor({
      createdAt: new Date(node.createdAt),
      id: BigInt(node.id),
    });
  }

  private decodeCursor(cursor: string): { createdAt: Date; id: bigint } {
    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const pipeIdx = decoded.indexOf('|');
      if (pipeIdx === -1) throw new Error('missing pipe separator');
      const isoStr = decoded.slice(0, pipeIdx);
      const idStr = decoded.slice(pipeIdx + 1);
      const createdAt = new Date(isoStr);
      if (isNaN(createdAt.getTime())) throw new Error('invalid date');
      const id = BigInt(idStr);
      return { createdAt, id };
    } catch {
      throw new BadRequestException('cursor không hợp lệ');
    }
  }

  private buildTree(
    roots: CommentRow[],
    descendants: CommentRow[],
  ): CommentNode[] {
    // Map root rows → nodes, preserve order
    const rootNodes: CommentNode[] = roots.map((r) => this.toNode(r));
    const nodeMap = new Map<string, CommentNode>();
    for (const node of rootNodes) {
      nodeMap.set(node.id, node);
    }

    // Map descendant rows → nodes, index them
    for (const row of descendants) {
      const node = this.toNode(row);
      nodeMap.set(node.id, node);
    }

    // Second pass: attach each descendant to its parent's replies
    for (const row of descendants) {
      const node = nodeMap.get(row.id.toString());
      if (!node || node.parentId === null) continue;
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.replies.push(node);
      }
    }

    return rootNodes;
  }

  private async getDirectReplyPreviews(
    parentIds: bigint[],
    limit: number,
  ): Promise<Map<string, CommentRow[]>> {
    const previews = new Map<string, CommentRow[]>();
    if (parentIds.length === 0 || limit <= 0) return previews;

    const rows = await this.prisma.$queryRaw<RawCommentRow[]>(
      Prisma.sql`
        WITH parent_ids(parent_id) AS (
          SELECT unnest(ARRAY[${Prisma.join(parentIds)}]::bigint[])
        )
        SELECT
          c.id,
          c.parent_id,
          c.depth,
          c.content,
          c.is_pinned,
          c.created_at,
          u.id AS user_id,
          u.display_name,
          u.avatar_url
        FROM parent_ids p
        CROSS JOIN LATERAL (
          SELECT *
          FROM test_comments c
          WHERE c.parent_id = p.parent_id
            AND c.deleted_at IS NULL
          ORDER BY c.created_at ASC, c.id ASC
          LIMIT ${limit}
        ) c
        JOIN users u ON u.id = c.user_id
        ORDER BY c.parent_id ASC, c.created_at ASC, c.id ASC
      `,
    );

    for (const raw of rows) {
      const row = this.rawToRow(raw);
      if (row.parentId === null) continue;
      const key = row.parentId.toString();
      const existing = previews.get(key) ?? [];
      existing.push(row);
      previews.set(key, existing);
    }

    return previews;
  }

  private async hydrateReplyCounts(nodes: CommentNode[]): Promise<void> {
    if (nodes.length === 0) return;

    const groups = await this.prisma.testComment.groupBy({
      by: ['parentId'],
      where: {
        parentId: { in: nodes.map((node) => BigInt(node.id)) },
        deletedAt: null,
      },
      _count: { _all: true },
    });

    const counts = new Map<string, number>();
    for (const group of groups) {
      if (group.parentId === null) continue;
      counts.set(group.parentId.toString(), group._count._all);
    }

    for (const node of nodes) {
      node.replyCount = counts.get(node.id) ?? 0;
      if (node.replies.length >= node.replyCount) {
        node.repliesNextCursor = null;
      }
    }
  }

  private async getTotalCount(testId: number): Promise<number> {
    const key = String(testId);
    const now = Date.now();
    const cached = this.countCache.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const value = await this.prisma.testComment.count({
      where: { testId, deletedAt: null },
    });

    pruneExpiredEntries(this.countCache, 500, now);
    this.countCache.set(key, { expiresAt: now + COUNT_CACHE_TTL_MS, value });

    return value;
  }
}
