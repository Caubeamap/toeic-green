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
    };

    expect(validateEnvironment(config)).toBe(config);
  });
});
