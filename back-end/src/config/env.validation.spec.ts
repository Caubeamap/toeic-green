import { validateEnvironment } from './env.validation';

// Hạ tầng bắt buộc ở production (ngoài JWT + mail) — dùng chung cho các case hợp lệ.
const PROD_INFRA = {
  DATABASE_URL: 'postgresql://user:pass@db.example:5432/app',
  REDIS_URL: 'rediss://default:pass@cache.example:6379',
  COOKIE_DOMAIN: '.toeicgreen.com',
  R2_ACCOUNT_ID: 'acc',
  R2_ACCESS_KEY: 'key',
  R2_SECRET_KEY: 'secret',
  R2_BUCKET_NAME: 'bucket',
  R2_PUBLIC_URL: 'https://assets.example.com',
};

describe('validateEnvironment', () => {
  it('allows development defaults', () => {
    expect(validateEnvironment({ NODE_ENV: 'development' })).toEqual({
      NODE_ENV: 'development',
    });
  });

  it('rejects missing or weak production JWT secrets', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      'JWT_SECRET must be configured',
    );
  });

  it('rejects matching production JWT secrets', () => {
    const secret = 'a'.repeat(32);

    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: secret,
        JWT_REFRESH_SECRET: secret,
      }),
    ).toThrow('must be different');
  });

  it('accepts strong and distinct production JWT secrets', () => {
    const config = {
      NODE_ENV: 'production',
      JWT_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      MAIL_PROVIDER: 'resend',
      RESEND_API_KEY: 're_test',
      EMAIL_FROM: 'TOEIC Green <no-reply@example.com>',
      ...PROD_INFRA,
    };

    expect(validateEnvironment(config)).toBe(config);
  });

  it('requires production infrastructure config (database/redis/r2)', () => {
    const base = {
      NODE_ENV: 'production',
      JWT_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      MAIL_PROVIDER: 'resend',
      RESEND_API_KEY: 're_test',
      EMAIL_FROM: 'TOEIC Green <no-reply@example.com>',
      ...PROD_INFRA,
    };

    expect(() =>
      validateEnvironment({ ...base, DATABASE_URL: undefined }),
    ).toThrow('DATABASE_URL must be configured');
    expect(() =>
      validateEnvironment({ ...base, REDIS_URL: undefined }),
    ).toThrow('REDIS_URL must be configured');
    expect(() =>
      validateEnvironment({ ...base, COOKIE_DOMAIN: undefined }),
    ).toThrow('COOKIE_DOMAIN must be configured');
    expect(() =>
      validateEnvironment({ ...base, R2_SECRET_KEY: undefined }),
    ).toThrow('R2_SECRET_KEY must be configured');
  });

  it('requires production mail delivery configuration', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'b'.repeat(32),
        MAIL_PROVIDER: 'resend',
        EMAIL_FROM: 'TOEIC Green <no-reply@example.com>',
      }),
    ).toThrow('RESEND_API_KEY must be configured');
  });

  it('rejects a known default secret in any environment', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        JWT_SECRET: 'default_jwt_access_secret_2026',
      }),
    ).toThrow('known default');
  });

  it('rejects the public .env.example placeholder secrets', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        JWT_SECRET: 'your_very_long_jwt_access_secret_key_2026',
      }),
    ).toThrow('known default');
  });

  it('rejects a weak secret even outside production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
        JWT_SECRET: 'short',
      }),
    ).toThrow('at least 32 characters');
  });

  it('accepts production SMTP mail configuration', () => {
    const config = {
      NODE_ENV: 'production',
      JWT_SECRET: 'a'.repeat(32),
      JWT_REFRESH_SECRET: 'b'.repeat(32),
      MAIL_PROVIDER: 'smtp',
      SMTP_USER: 'demo@gmail.com',
      SMTP_APP_PASSWORD: 'example-app-password',
      EMAIL_FROM: 'TOEIC Green <demo@gmail.com>',
      ...PROD_INFRA,
    };

    expect(validateEnvironment(config)).toBe(config);
  });
});
