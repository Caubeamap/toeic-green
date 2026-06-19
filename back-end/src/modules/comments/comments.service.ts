import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { pruneExpiredEntries } from '../../common/utils/prune-expired-cache';
import { CreateCommentDto } from './dto/create-comment.dto';

/* ──────────────────────────── Constants ──────────────────────────────────── */

const COUNT_CACHE_TTL_MS = 30_000;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

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
  replies: CommentNode[];
}

export interface CommentFeed {
  comments: CommentNode[];
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
    opts: { cursor?: string; limit?: number },
  ): Promise<CommentFeed> {
    const testId = await this.resolveTestId(slug);
    const limit = Math.min(Math.max(opts.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
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

    // (4) Fetch all descendants for the visible root set
    const rootIds = allRoots.map((r) => r.id);
    const descendants: CommentRow[] =
      rootIds.length > 0
        ? await this.prisma.testComment.findMany({
            where: { rootId: { in: rootIds }, deletedAt: null },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            select,
          })
        : [];

    // (5) Next cursor
    const last = visibleRoots[visibleRoots.length - 1];
    const nextCursor = hasMore && last ? this.encodeCursor(last) : null;

    return {
      comments: this.buildTree(allRoots, descendants),
      nextCursor,
      totalCount: await this.getTotalCount(testId),
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
      replies: [],
    };
  }

  private encodeCursor(row: { createdAt: Date; id: bigint }): string {
    return Buffer.from(
      `${row.createdAt.toISOString()}|${row.id.toString()}`,
    ).toString('base64url');
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
