import { validateEnvironment } from './env.validation';

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
    };

    expect(validateEnvironment(config)).toBe(config);
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
    };

    expect(validateEnvironment(config)).toBe(config);
  });
});
