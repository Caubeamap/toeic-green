import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(30000);

interface LoginResponseBody {
  accessToken: string;
}

interface RegisterResponseBody {
  email: string;
}

describe('Backend security baseline (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const email = `auth-e2e-${Date.now()}@example.com`;
  const password = 'SecurePass123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('protects routes by default with the global JWT guard', async () => {
    await request(app.getHttpServer()).get('/api').expect(401);
  });

  it('lets public auth routes reach validation and controller logic', async () => {
    await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'invalid', password: 'short', displayName: '' })
      .expect(400);
  });

  it('normalizes email casing and rejects case-variant duplicates', async () => {
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
      .expect(200);
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
