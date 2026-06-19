import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';
import { GoogleTokenVerifier } from '../src/modules/auth/strategies/google-token-verifier';

jest.setTimeout(30000);

interface GoogleLoginBody {
  accessToken: string;
  user: { email: string; displayName: string };
}

/**
 * E2E cho đăng nhập Google qua HTTP + constraint DB thật. GoogleTokenVerifier được
 * MOCK (không gọi Google) — `verify(credential)` tra cứu identity theo credential.
 */
describe('Google sign-in policy (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const ts = Date.now();
  const googleEmail = `gauth-${ts}@example.com`;
  const googleSub = `google-sub-${ts}`;
  const passwordEmail = `gpwd-${ts}@example.com`;
  const password = 'SecurePass123!';

  // credential -> identity Google giả lập
  const identities: Record<
    string,
    {
      sub: string;
      email: string;
      emailVerified: boolean;
      name: string | null;
      picture: string | null;
    }
  > = {
    'cred-google': {
      sub: googleSub,
      email: googleEmail,
      emailVerified: true,
      name: 'Google User',
      picture: 'https://lh3.googleusercontent.com/pic',
    },
    'cred-reverse': {
      sub: `other-sub-${ts}`,
      email: passwordEmail,
      emailVerified: true,
      name: 'Reverse User',
      picture: null,
    },
  };

  const googleTokenVerifier = {
    verify: jest.fn((credential: string) => {
      const identity = identities[credential];
      return identity
        ? Promise.resolve(identity)
        : Promise.reject(new Error('invalid'));
    }),
  };
  const mailService = {
    sendEmailVerification: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleTokenVerifier)
      .useValue(googleTokenVerifier)
      .overrideProvider(MailService)
      .useValue(mailService)
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    // Dọn sạch trước khi chạy (đề phòng lần chạy trước lỗi giữa chừng).
    await prisma.pendingRegistration.deleteMany({
      where: { email: { in: [googleEmail, passwordEmail] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [googleEmail, passwordEmail] } },
    });
  });

  afterAll(async () => {
    await prisma.pendingRegistration.deleteMany({
      where: { email: { in: [googleEmail, passwordEmail] } },
    });
    // Xoá user → cascade xoá oauth_accounts / user_profiles / tokens / sessions.
    await prisma.user.deleteMany({
      where: { email: { in: [googleEmail, passwordEmail] } },
    });
    await app.close();
  });

  it('tạo tài khoản Google mới (không mật khẩu, email đã xác minh)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/google')
      .send({ credential: 'cred-google' })
      .expect(200);
    const body = response.body as GoogleLoginBody;

    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(googleEmail);
    expect(response.headers['set-cookie']).toBeDefined();

    const user = await prisma.user.findUnique({
      where: { email: googleEmail },
      select: { id: true, passwordHash: true, emailVerifiedAt: true },
    });
    expect(user).not.toBeNull();
    expect(user?.passwordHash).toBeNull();
    expect(user?.emailVerifiedAt).not.toBeNull();
    await expect(
      prisma.oAuthAccount.count({
        where: { provider: 'google', providerUserId: googleSub },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.userProfile.count({ where: { userId: user!.id } }),
    ).resolves.toBe(1);
  });

  it('đăng nhập lại bằng Google không tạo tài khoản trùng', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/google')
      .send({ credential: 'cred-google' })
      .expect(200);

    await expect(
      prisma.user.count({ where: { email: googleEmail } }),
    ).resolves.toBe(1);
    await expect(
      prisma.oAuthAccount.count({
        where: { provider: 'google', providerUserId: googleSub },
      }),
    ).resolves.toBe(1);
  });

  it('CHẶN đăng ký mật khẩu trùng email tài khoản Google', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: googleEmail, password, displayName: 'Trùng Google' })
      .expect(409);

    expect((response.body as { message: string }).message).toContain('Google');
  });

  it('Quên mật khẩu cho tài khoản Google là no-op (không tạo token)', async () => {
    const user = await prisma.user.findUnique({
      where: { email: googleEmail },
      select: { id: true },
    });

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: googleEmail })
      .expect(200);

    await expect(
      prisma.passwordResetToken.count({ where: { userId: user!.id } }),
    ).resolves.toBe(0);
  });

  it('CHẶN đăng nhập Google khi email đã là tài khoản mật khẩu', async () => {
    // Tạo trực tiếp một tài khoản mật khẩu đã xác minh.
    const created = await prisma.user.create({
      data: {
        email: passwordEmail,
        passwordHash: 'bcrypt-hash-placeholder',
        displayName: 'Password User',
        emailVerifiedAt: new Date(),
      },
    });
    await prisma.userProfile.create({
      data: { userId: created.id, bannerTone: 'mint' },
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/google')
      .send({ credential: 'cred-reverse' })
      .expect(409);

    expect((response.body as { message: string }).message).toContain(
      'mật khẩu',
    );
    // Không tạo OAuthAccount cho email này.
    await expect(
      prisma.oAuthAccount.count({
        where: { providerUserId: `other-sub-${ts}` },
      }),
    ).resolves.toBe(0);
  });
});
