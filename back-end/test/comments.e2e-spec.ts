import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

jest.setTimeout(60000);

interface CommentNode {
  id: string;
  parentId: string | null;
  depth: number;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
  replies: CommentNode[];
}

interface CommentFeed {
  comments: CommentNode[];
  nextCursor: string | null;
  totalCount: number;
}

const mailService = {
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
};

describe('Comments API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  let testId: number;
  let userId: string;
  let slug: string;

  const ts = Date.now();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mailService)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);
    const config = app.get(ConfigService);

    slug = `test-comments-${ts}`;
    const email = `comments-e2e-${ts}@example.com`;

    const createdTest = await prisma.test.create({
      data: {
        slug,
        title: 'Comments E2E Test',
        type: 'TOEIC',
        shortType: 'TOEIC',
        isPublished: true,
      },
    });
    testId = createdTest.id;

    const createdUser = await prisma.user.create({
      data: {
        email,
        displayName: 'Comments E2E User',
        passwordHash: 'x',
        emailVerifiedAt: new Date(),
      },
    });
    userId = createdUser.id;

    token = await jwtService.signAsync(
      { sub: userId, email, role: 'USER' },
      { secret: config.get<string>('jwt.secret'), expiresIn: '15m' },
    );
  });

  afterAll(async () => {
    await prisma.testComment.deleteMany({ where: { testId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.test.deleteMany({ where: { id: testId } });
    await app.close();
  });

  // ── Case 1: Guest POST → 401 ──────────────────────────────────────────────

  it('guest POST (no Authorization) → 401', async () => {
    await request(app.getHttpServer())
      .post(`/api/practice/tests/${slug}/comments`)
      .send({ content: 'hello' })
      .expect(401);
  });

  // ── Case 2: Validation errors → 400 ───────────────────────────────────────

  it('POST whitespace-only content → 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/practice/tests/${slug}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '   ' })
      .expect(400);
  });

  it('POST content longer than 2000 chars → 400', async () => {
    await request(app.getHttpServer())
      .post(`/api/practice/tests/${slug}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'x'.repeat(2001) })
      .expect(400);
  });

  // ── Case 3: Threaded replies & feed nesting ───────────────────────────────

  it('POST root, reply, reply-of-reply → correct depth + feed nesting', async () => {
    // Post root comment
    const rootRes = await request(app.getHttpServer())
      .post(`/api/practice/tests/${slug}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'root' })
      .expect(201);

    const rootBody = rootRes.body as CommentNode;
    expect(rootBody.depth).toBe(0);
    const rootId = rootBody.id;

    // Post first reply
    const replyRes = await request(app.getHttpServer())
      .post(`/api/practice/tests/${slug}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'reply', parentId: rootId })
      .expect(201);

    const replyBody = replyRes.body as CommentNode;
    expect(replyBody.parentId).toBe(rootId);
    expect(replyBody.depth).toBe(1);
    const replyId = replyBody.id;

    // Post reply-of-reply
    const reply2Res = await request(app.getHttpServer())
      .post(`/api/practice/tests/${slug}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'reply2', parentId: replyId })
      .expect(201);

    const reply2Body = reply2Res.body as CommentNode;
    expect(reply2Body.depth).toBe(2);
    const reply2Id = reply2Body.id;

    // GET feed
    const feedRes = await request(app.getHttpServer())
      .get(`/api/practice/tests/${slug}/comments`)
      .expect(200);

    const feed = feedRes.body as CommentFeed;
    expect(feed.totalCount).toBe(3);

    const rootNode = feed.comments.find((c) => c.id === rootId);
    expect(rootNode).toBeDefined();
    expect(rootNode!.replies).toHaveLength(1);
    expect(rootNode!.replies[0].id).toBe(replyId);
    expect(rootNode!.replies[0].replies).toHaveLength(1);
    expect(rootNode!.replies[0].replies[0].id).toBe(reply2Id);
  });

  // ── Case 4: Soft-deleted comments excluded ────────────────────────────────

  it('comment with deletedAt set is excluded from GET feed', async () => {
    const hidden = await prisma.testComment.create({
      data: {
        testId,
        userId,
        content: 'hidden',
        deletedAt: new Date(),
      },
    });

    const feedRes = await request(app.getHttpServer())
      .get(`/api/practice/tests/${slug}/comments`)
      .expect(200);

    const feed = feedRes.body as CommentFeed;
    const allIds = collectAllIds(feed.comments);
    expect(allIds).not.toContain(hidden.id.toString());
  });

  // ── Case 5a: Non-numeric limit falls back to default (regression for NaN → 500) ──

  it('GET ?limit=abc returns 200 with a valid feed (uses default limit)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/practice/tests/${slug}/comments?limit=abc`)
      .expect(200);

    const feed = res.body as CommentFeed;
    expect(typeof feed.totalCount).toBe('number');
    expect(Array.isArray(feed.comments)).toBe(true);
    expect(feed).toHaveProperty('nextCursor');
  });

  // ── Case 5: Keyset pagination ─────────────────────────────────────────────

  it('keyset pagination: ?limit=2 returns 2 items + nextCursor, page 2 has no overlap', async () => {
    // Insert extra root comments via prisma directly to avoid HTTP throttle
    await prisma.testComment.create({
      data: { testId, userId, content: 'extra1', depth: 0 },
    });
    await prisma.testComment.create({
      data: { testId, userId, content: 'extra2', depth: 0 },
    });
    await prisma.testComment.create({
      data: { testId, userId, content: 'extra3', depth: 0 },
    });

    // Page 1
    const page1Res = await request(app.getHttpServer())
      .get(`/api/practice/tests/${slug}/comments?limit=2`)
      .expect(200);

    const page1 = page1Res.body as CommentFeed;
    expect(page1.comments).toHaveLength(2);
    expect(page1.nextCursor).toBeTruthy();

    const page1Ids = new Set(page1.comments.map((c) => c.id));

    // Page 2
    const page2Res = await request(app.getHttpServer())
      .get(
        `/api/practice/tests/${slug}/comments?limit=2&cursor=${encodeURIComponent(page1.nextCursor!)}`,
      )
      .expect(200);

    const page2 = page2Res.body as CommentFeed;
    expect(page2.comments.length).toBeGreaterThanOrEqual(1);

    // No overlap
    for (const comment of page2.comments) {
      expect(page1Ids.has(comment.id)).toBe(false);
    }
  });
});

/** Recursively collect all comment ids in the tree */
function collectAllIds(nodes: CommentNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    ids.push(...collectAllIds(node.replies));
  }
  return ids;
}
