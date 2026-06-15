const MINIMUM_SECRET_LENGTH = 32;

export function validateEnvironment(config: Record<string, unknown>) {
  if (config.NODE_ENV !== 'production') {
    return config;
  }

  const accessSecret = requireProductionSecret(config, 'JWT_SECRET');
  const refreshSecret = requireProductionSecret(config, 'JWT_REFRESH_SECRET');

  if (accessSecret === refreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  return config;
}

function requireProductionSecret(
  config: Record<string, unknown>,
  name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET',
) {
  const value = config[name];

  if (typeof value !== 'string' || value.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `${name} must be configured with at least ${MINIMUM_SECRET_LENGTH} characters in production`,
    );
  }

  return value;
}
