import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';

jest.setTimeout(30000);

describe('Auth refresh cookie attributes (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let originalCookieDomain: string | undefined;
  let originalCookieSecure: string | undefined;

  const email = `auth-cookie-${Date.now()}@example.com`;
  const password = 'SecurePass123!';

  beforeAll(async () => {
    originalCookieDomain = process.env.COOKIE_DOMAIN;
    originalCookieSecure = process.env.COOKIE_SECURE;
    process.env.COOKIE_DOMAIN = '.toeicgreen.com';
    process.env.COOKIE_SECURE = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({
        sendEmailVerification: jest.fn().mockResolvedValue(undefined),
        sendPasswordReset: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.user.deleteMany({ where: { email } });
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: 'Cookie E2E',
        emailVerifiedAt: new Date(),
        profile: { create: { bannerTone: 'mint' } },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();

    if (originalCookieDomain === undefined) {
      delete process.env.COOKIE_DOMAIN;
    } else {
      process.env.COOKIE_DOMAIN = originalCookieDomain;
    }
    if (originalCookieSecure === undefined) {
      delete process.env.COOKIE_SECURE;
    } else {
      process.env.COOKIE_SECURE = originalCookieSecure;
    }
  });

  it('sets a parent-domain persistent refresh cookie so frontend SSR can bootstrap the session', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password, rememberMe: true })
      .expect(200);
    const refreshSetCookie = getRefreshSetCookie(response);

    expect(refreshSetCookie).toContain('Domain=.toeicgreen.com');
    expect(refreshSetCookie).toContain('Max-Age=604800');
    expect(refreshSetCookie).toContain('HttpOnly');
    expect(refreshSetCookie).toContain('Secure');
    expect(refreshSetCookie).toContain('SameSite=Strict');
  });
});

function getRefreshSetCookie(response: Response) {
  const setCookieHeader = response.headers['set-cookie'] as unknown;
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader.filter(
        (cookie): cookie is string => typeof cookie === 'string',
      )
    : typeof setCookieHeader === 'string'
      ? [setCookieHeader]
      : [];
  const refreshSetCookie = cookies.find((cookie) =>
    cookie.startsWith('refresh_token='),
  );

  if (!refreshSetCookie) {
    throw new Error('Expected refresh_token Set-Cookie header');
  }

  return refreshSetCookie;
}
