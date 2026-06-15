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

  requireProductionValue(config, 'EMAIL_FROM');
  validateMailProvider(config);

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

function validateMailProvider(config: Record<string, unknown>) {
  const provider = config.MAIL_PROVIDER;

  if (provider === 'resend') {
    requireProductionValue(config, 'RESEND_API_KEY');
    return;
  }

  if (provider === 'smtp') {
    requireProductionValue(config, 'SMTP_USER');
    requireProductionValue(config, 'SMTP_APP_PASSWORD');
    return;
  }

  throw new Error('MAIL_PROVIDER must be either resend or smtp in production');
}

function requireProductionValue(config: Record<string, unknown>, name: string) {
  const value = config[name];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be configured in production`);
  }

  return value;
}
