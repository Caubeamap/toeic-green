import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';
import { GoogleTokenVerifier } from '../src/modules/auth/strategies/google-token-verifier';

jest.setTimeout(30000);

/**
 * Kiểm chứng yêu cầu "hoạt động tốt khi nhiều người dùng đồng thời": nhiều request
 * đăng nhập Google cho CÙNG một email mới (ví dụ double-click / nhiều tab) phải tạo
 * ĐÚNG MỘT user, phần còn lại tái dùng — nhờ unique constraint + bắt P2002. Không
 * có lỗi 500. App instance riêng để throttler có bucket mới (limit 10/phút/IP).
 */
describe('Google sign-in concurrency (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const ts = Date.now();
  const email = `gconc-${ts}@example.com`;
  const sub = `conc-sub-${ts}`;
  const CONCURRENCY = 9; // < giới hạn throttler 10/phút để đo đúng race, không bị 429

  const googleTokenVerifier = {
    verify: jest.fn(() =>
      Promise.resolve({
        sub,
        email,
        emailVerified: true,
        name: 'Concurrent User',
        picture: null,
      }),
    ),
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

    await prisma.user.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('nhiều request Google đồng thời cùng email → đúng 1 user, không lỗi 500', async () => {
    const responses = await Promise.all(
      Array.from({ length: CONCURRENCY }, () =>
        request(app.getHttpServer())
          .post('/api/auth/google')
          .send({ credential: 'cred' }),
      ),
    );

    // Không có lỗi máy chủ; mọi request hợp lệ (cùng email mới) đều thành công.
    expect(responses.some((r) => r.status >= 500)).toBe(false);
    expect(responses.every((r) => r.status === 200)).toBe(true);

    // Tất cả trỏ về cùng một user id.
    const ids = new Set(
      responses.map(
        (r) => (r.body as { user: { id: string } }).user.id,
      ),
    );
    expect(ids.size).toBe(1);

    // DB chỉ có đúng 1 user + 1 OAuthAccount cho cặp (google, sub).
    await expect(prisma.user.count({ where: { email } })).resolves.toBe(1);
    await expect(
      prisma.oAuthAccount.count({
        where: { provider: 'google', providerUserId: sub },
      }),
    ).resolves.toBe(1);
  });
});
