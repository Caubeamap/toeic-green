import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request, { Response } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/modules/mail/mail.service';

jest.setTimeout(30000);

interface LoginResponseBody {
  accessToken: string;
}

interface RegisterResponseBody {
  email: string;
}

interface ValidationErrorResponseBody {
  message: string;
  validationErrors: Array<{
    field: string;
    messages: string[];
  }>;
}

describe('Backend security baseline (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const verificationTokens = new Map<string, string>();
  const resetTokens = new Map<string, string>();
  const mailService = {
    sendEmailVerification: jest.fn((targetEmail: string, token: string) => {
      verificationTokens.set(targetEmail, token);
      return Promise.resolve();
    }),
    sendPasswordReset: jest.fn((targetEmail: string, otp: string) => {
      resetTokens.set(targetEmail, otp);
      return Promise.resolve();
    }),
  };
  const email = `auth-e2e-${Date.now()}@example.com`;
  const password = 'SecurePass123!';

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
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('protects routes by default with the global JWT guard', async () => {
    const response = await request(app.getHttpServer()).get('/api/profile').expect(401);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('lets public auth routes reach validation and controller logic', async () => {
    await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
  });

  it('rejects request bodies larger than the configured limit', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'large-body@example.com',
        password,
        displayName: 'x'.repeat(110 * 1024),
      })
      .expect(413);
  });

  it('rejects weak passwords and unknown request fields', async () => {
    const invalidPayloadResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `weak-${email}`,
        password: 'weakpass',
        displayName: 'Weak Password',
        role: 'ADMIN',
      })
      .expect(400);
    const invalidPayloadBody =
      invalidPayloadResponse.body as ValidationErrorResponseBody;

    expect(invalidPayloadBody.message).toBe('Dữ liệu gửi lên không hợp lệ.');
    const validationMessages = invalidPayloadBody.validationErrors.flatMap(
      (issue) => issue.messages,
    );

    expect(validationMessages).toEqual(
      expect.arrayContaining([
        'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt',
        'property role should not exist',
      ]),
    );
    expect(invalidPayloadBody.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'password' }),
        expect.objectContaining({ field: 'role' }),
      ]),
    );
  });

  it('normalizes email and requires one-time verification before login', async () => {
    const mixedCaseEmail = email.toUpperCase();

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `  ${mixedCaseEmail}  `,
        password,
        displayName: 'Auth E2E',
      })
      .expect(201);
    const registerBody = registerResponse.body as RegisterResponseBody;

    expect(registerBody.email).toBe(email);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password, displayName: 'Duplicate Auth E2E' })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: mixedCaseEmail, password })
      .expect(401);

    const wrongPasswordResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: mixedCaseEmail, password: 'WrongPassword123!' })
      .expect(401);
    expect(wrongPasswordResponse.body).toEqual(
      expect.objectContaining({
        message: 'Email hoặc mật khẩu không chính xác',
      }),
    );

    const firstToken = verificationTokens.get(email);
    if (!firstToken) {
      throw new Error('Expected initial email verification token');
    }

    await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: mixedCaseEmail })
      .expect(200);

    const replacementToken = verificationTokens.get(email);
    if (!replacementToken || replacementToken === firstToken) {
      throw new Error('Expected replacement email verification token');
    }

    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token: firstToken })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token: replacementToken })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .send({ token: replacementToken })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: mixedCaseEmail, password })
      .expect(200);
  });

  it('does not reveal whether a resend email belongs to an account', async () => {
    const existingResponse = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email })
      .expect(200);
    const missingResponse = await request(app.getHttpServer())
      .post('/api/auth/resend-verification')
      .send({ email: `missing-${email}` })
      .expect(200);

    expect(existingResponse.body).toEqual(missingResponse.body);
  });

  it('rejects non-canonical email writes at the database boundary', async () => {
    const directEmail = `Direct-${Date.now()}@example.com`;

    try {
      await expect(
        prisma.$executeRaw`
          INSERT INTO users (email, display_name)
          VALUES (${directEmail}, 'Direct E2E')
        `,
      ).rejects.toThrow();
    } finally {
      await prisma.user.deleteMany({
        where: { email: { in: [directEmail, directEmail.toLowerCase()] } },
      });
    }
  });

  it('rotates refresh tokens, rejects replay, and revokes on logout', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const firstCookie = getRefreshCookie(loginResponse);
    const loginBody = loginResponse.body as LoginResponseBody;

    await request(app.getHttpServer())
      .get('/api/profile')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/profile')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .send({ bannerTone: 'admin-controlled' })
      .expect(400);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', firstCookie)
      .expect(200);
    const secondCookie = getRefreshCookie(refreshResponse);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', firstCookie)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', secondCookie)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', secondCookie)
      .expect(401);
  });

  it('handles forgot password requests without disclosing email existence', async () => {
    const resExist = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email })
      .expect(200);

    expect((resExist.body as Record<string, unknown>).message).toBeDefined();

    const resMissing = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: `missing-${email}` })
      .expect(200);

    expect(resExist.body).toEqual(resMissing.body);
    expect(resetTokens.has(email)).toBe(true);
    expect(resetTokens.has(`missing-${email}`)).toBe(false);
  });

  it('rejects reset password with invalid or weak password policy', async () => {
    const otp = resetTokens.get(email);
    expect(otp).toBeDefined();

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ email, otp, password: 'weak' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ email, otp: '', password: 'NewSecurePass123!' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ email, otp: 'invalid-otp', password: 'NewSecurePass123!' })
      .expect(400);
  });

  it('resets password successfully with valid token, revoking all active sessions and auto-verifying email', async () => {
    const otp = resetTokens.get(email);
    const newPassword = 'NewSecurePass123!';

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const refreshCookie = getRefreshCookie(loginRes);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ email, otp, password: newPassword })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: newPassword })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ email, otp, password: newPassword })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email })
      .expect(200);
    const finalOtp = resetTokens.get(email);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ email, otp: finalOtp, password })
      .expect(200);
  });

  it('rate limits repeated login attempts', async () => {
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'missing@example.com', password });
      statuses.push(response.status);
    }

    expect(statuses).toContain(429);
  });
});

function getRefreshCookie(response: Response) {
  const headers = response.headers as Record<string, unknown>;
  const setCookie = headers['set-cookie'];
  const cookie =
    Array.isArray(setCookie) && typeof setCookie[0] === 'string'
      ? setCookie[0]
      : undefined;

  if (!cookie) {
    throw new Error('Expected refresh_token cookie');
  }

  return [cookie.split(';')[0]];
}
