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

const mailService = {
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
};

describe('Comments concurrency (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  let testId: number;
  let userId: string;
  let rootId: string;
  let slug: string;

  const ts = Date.now();
  const N = 6;

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

    slug = `test-conc-comments-${ts}`;
    const email = `comments-conc-${ts}@example.com`;

    const createdTest = await prisma.test.create({
      data: {
        slug,
        title: 'Comments Concurrency E2E',
        type: 'TOEIC',
        shortType: 'TOEIC',
        isPublished: true,
      },
    });
    testId = createdTest.id;

    const createdUser = await prisma.user.create({
      data: {
        email,
        displayName: 'Comments Conc User',
        passwordHash: 'x',
        emailVerifiedAt: new Date(),
      },
    });
    userId = createdUser.id;

    token = await jwtService.signAsync(
      { sub: userId, email, role: 'USER' },
      { secret: config.get<string>('jwt.secret'), expiresIn: '15m' },
    );

    // Create the root comment via prisma directly (no HTTP POST)
    const rootComment = await prisma.testComment.create({
      data: { testId, userId, content: 'root', depth: 0 },
    });
    rootId = rootComment.id.toString();
  });

  afterAll(async () => {
    await prisma.testComment.deleteMany({ where: { testId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.test.deleteMany({ where: { id: testId } });
    await app.close();
  });

  it(`${N} concurrent reply POSTs → all 201, none 5xx, DB count = ${N}`, async () => {
    const responses = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        request(app.getHttpServer())
          .post(`/api/practice/tests/${slug}/comments`)
          .set('Authorization', `Bearer ${token}`)
          .send({ content: `r${i}`, parentId: rootId }),
      ),
    );

    for (const res of responses) {
      expect(res.status).toBe(201);
    }

    expect(responses.some((r) => r.status >= 500)).toBe(false);

    const count = await prisma.testComment.count({
      where: { testId, parentId: BigInt(rootId) },
    });
    expect(count).toBe(N);
  });
});
