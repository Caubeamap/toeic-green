import { BadRequestException } from '@nestjs/common';
import {
  CommentsService,
  type CommentNode,
  type CommentFeed,
} from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

/**
 * Unit test cho CommentsService.create — kiểm tra logic phân cấp bình luận
 * (root / reply / nested) và các điều kiện lỗi, không cần DB.
 */
describe('CommentsService.create', () => {
  let service: CommentsService;
  let prismaMock: {
    test: { findUnique: jest.Mock };
    testComment: { findUnique: jest.Mock; create: jest.Mock };
  };

  const userId = 'user-uuid-1';
  const slug = 'test-slug';

  /** Row trả về từ testComment.create khi mock thành công */
  function makeCreatedRow(overrides: {
    id: bigint;
    parentId: bigint | null;
    depth: number;
  }) {
    return {
      id: overrides.id,
      parentId: overrides.parentId,
      depth: overrides.depth,
      content: 'Nội dung bình luận',
      isPinned: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      user: {
        id: userId,
        displayName: 'Test User',
        avatarUrl: null,
      },
    };
  }

  beforeEach(() => {
    prismaMock = {
      test: { findUnique: jest.fn() },
      testComment: { findUnique: jest.fn(), create: jest.fn() },
    };

    // test.findUnique trả về bài thi hợp lệ theo mặc định
    prismaMock.test.findUnique.mockResolvedValue({ id: 7, isPublished: true });

    service = new CommentsService(prismaMock as never);
  });

  /* ─────────────────────────── Case 1: Root comment ─────────────────────────── */

  it('bình luận gốc: create gọi với parentId=null, rootId=null, depth=0', async () => {
    const createdId = BigInt('1001');
    prismaMock.testComment.create.mockResolvedValue(
      makeCreatedRow({ id: createdId, parentId: null, depth: 0 }),
    );

    const dto: CreateCommentDto = { content: 'Bình luận gốc' };
    const result: CommentNode = await service.create(userId, slug, dto);

    const callData = (
      prismaMock.testComment.create.mock.calls[0] as [
        {
          data: {
            parentId: bigint | null;
            rootId: bigint | null;
            depth: number;
          };
        },
      ]
    )[0].data;
    expect(callData.parentId).toBeNull();
    expect(callData.rootId).toBeNull();
    expect(callData.depth).toBe(0);
    expect(result.id).toBe('1001');
    expect(result.depth).toBe(0);
    expect(result.parentId).toBeNull();
    expect(result.replies).toEqual([]);
  });

  /* ─────────────────────── Case 2: Reply to ROOT ─────────────────────────── */

  it('reply to root: parentId=bigint cha, rootId=id cha, depth=1; trả về parentId dạng string', async () => {
    const parentBigInt = BigInt('500');
    const parentRow = {
      id: parentBigInt,
      testId: 7,
      parentId: null, // cha là root
      rootId: null,
      depth: 0,
      deletedAt: null,
    };
    prismaMock.testComment.findUnique.mockResolvedValue(parentRow);

    const createdId = BigInt('1002');
    prismaMock.testComment.create.mockResolvedValue(
      makeCreatedRow({ id: createdId, parentId: parentBigInt, depth: 1 }),
    );

    const dto: CreateCommentDto = { content: 'Reply', parentId: '500' };
    const result: CommentNode = await service.create(userId, slug, dto);

    const callData = (
      prismaMock.testComment.create.mock.calls[0] as [
        {
          data: {
            parentId: bigint | null;
            rootId: bigint | null;
            depth: number;
          };
        },
      ]
    )[0].data;
    expect(callData.parentId).toBe(parentBigInt);
    expect(callData.rootId).toBe(parentBigInt); // parent.parentId===null → rootId = parent.id
    expect(callData.depth).toBe(1);
    expect(result.id).toBe('1002');
    expect(result.parentId).toBe('500');
    expect(result.depth).toBe(1);
  });

  /* ─────────────────────── Case 3: Reply to REPLY ─────────────────────────── */

  it('reply to reply: rootId giữ nguyên root của thread, depth tăng đúng', async () => {
    const grandparentId = BigInt('400');
    const parentBigInt = BigInt('500');
    const parentRow = {
      id: parentBigInt,
      testId: 7,
      parentId: grandparentId, // parent không phải root
      rootId: grandparentId,
      depth: 1,
      deletedAt: null,
    };
    prismaMock.testComment.findUnique.mockResolvedValue(parentRow);

    const createdId = BigInt('1003');
    prismaMock.testComment.create.mockResolvedValue(
      makeCreatedRow({ id: createdId, parentId: parentBigInt, depth: 2 }),
    );

    const dto: CreateCommentDto = { content: 'Nested reply', parentId: '500' };
    const result: CommentNode = await service.create(userId, slug, dto);

    const callData = (
      prismaMock.testComment.create.mock.calls[0] as [
        {
          data: {
            parentId: bigint | null;
            rootId: bigint | null;
            depth: number;
          };
        },
      ]
    )[0].data;
    expect(callData.parentId).toBe(parentBigInt);
    expect(callData.rootId).toBe(grandparentId); // rootId giữ nguyên từ thread
    expect(callData.depth).toBe(2);
    expect(result.depth).toBe(2);
  });

  /* ──────────────── Case 4: parent thuộc test khác → BadRequest ─────────────── */

  it('parent thuộc testId khác → BadRequestException', async () => {
    prismaMock.testComment.findUnique.mockResolvedValue({
      id: BigInt('500'),
      testId: 99, // khác testId=7
      parentId: null,
      rootId: null,
      depth: 0,
      deletedAt: null,
    });

    const dto: CreateCommentDto = { content: 'Reply', parentId: '500' };

    await expect(service.create(userId, slug, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaMock.testComment.create).not.toHaveBeenCalled();
  });

  /* ──────────────── Case 5: test không tồn tại / chưa publish ────────────── */

  it('test không tồn tại → BadRequestException', async () => {
    prismaMock.test.findUnique.mockResolvedValue(null);

    const dto: CreateCommentDto = { content: 'Hello' };

    await expect(service.create(userId, slug, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaMock.testComment.create).not.toHaveBeenCalled();
  });

  it('test chưa được publish → BadRequestException', async () => {
    prismaMock.test.findUnique.mockResolvedValue({
      id: 7,
      isPublished: false,
    });

    const dto: CreateCommentDto = { content: 'Hello' };

    await expect(service.create(userId, slug, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prismaMock.testComment.create).not.toHaveBeenCalled();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   CommentsService.list — paginated feed with tree nesting
   ═══════════════════════════════════════════════════════════════════════════ */
describe('CommentsService.list', () => {
  let service: CommentsService;
  let prismaMock: {
    test: { findUnique: jest.Mock };
    testComment: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  const slug = 'test-slug';

  function makeRow(overrides: {
    id: bigint;
    parentId: bigint | null;
    depth: number;
    createdAt?: Date;
  }) {
    return {
      id: overrides.id,
      parentId: overrides.parentId,
      depth: overrides.depth,
      content: 'Some content',
      isPinned: false,
      createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
      user: {
        id: 'user-uuid-1',
        displayName: 'Test User',
        avatarUrl: null,
      },
    };
  }

  beforeEach(() => {
    prismaMock = {
      test: { findUnique: jest.fn() },
      testComment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    prismaMock.test.findUnique.mockResolvedValue({ id: 7, isPublished: true });
    prismaMock.testComment.count.mockResolvedValue(3);

    service = new CommentsService(prismaMock as never);
  });

  /* ─────────────────────── tree nesting (depth 0→1→2) ─────────────────────── */

  it('tree nesting: xây cây 3 cấp, trả totalCount, nextCursor=null', async () => {
    // call order: (1) pinnedRoots → [], (2) pageRoots → root 100, (3) descendants → 101, 102
    prismaMock.testComment.findMany
      .mockResolvedValueOnce([]) // pinnedRoots
      .mockResolvedValueOnce([makeRow({ id: 100n, parentId: null, depth: 0 })]) // pageRoots
      .mockResolvedValueOnce([
        makeRow({ id: 101n, parentId: 100n, depth: 1 }),
        makeRow({ id: 102n, parentId: 101n, depth: 2 }),
      ]); // descendants

    const feed: CommentFeed = await service.list(slug, {});

    expect(feed.totalCount).toBe(3);
    expect(feed.nextCursor).toBeNull();
    expect(feed.comments).toHaveLength(1);

    const root = feed.comments[0];
    expect(root.id).toBe('100');
    expect(root.replies).toHaveLength(1);

    const reply1 = root.replies[0];
    expect(reply1.id).toBe('101');
    expect(reply1.replies).toHaveLength(1);

    const reply2 = reply1.replies[0];
    expect(reply2.id).toBe('102');
    expect(reply2.replies).toHaveLength(0);
  });

  /* ─────────────────────── hasMore / nextCursor ─────────────────────────── */

  it('hasMore: limit+1 rows → nextCursor non-null và chỉ trả limit roots', async () => {
    const limit = 2;
    // pinnedRoots → [], pageRoots → limit+1=3 rows, descendants → []
    prismaMock.testComment.findMany
      .mockResolvedValueOnce([]) // pinnedRoots
      .mockResolvedValueOnce([
        makeRow({
          id: 10n,
          parentId: null,
          depth: 0,
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
        }),
        makeRow({
          id: 11n,
          parentId: null,
          depth: 0,
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
        }),
        makeRow({
          id: 12n,
          parentId: null,
          depth: 0,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ]) // pageRoots (limit+1)
      .mockResolvedValueOnce([]); // descendants

    const feed: CommentFeed = await service.list(slug, { limit });

    expect(feed.comments).toHaveLength(limit);
    expect(feed.nextCursor).not.toBeNull();
    expect(typeof feed.nextCursor).toBe('string');
  });

  /* ─────────────────────── invalid cursor → BadRequestException ─────────────── */

  it('cursor không hợp lệ → BadRequestException', async () => {
    await expect(service.list(slug, { cursor: '!!!' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
