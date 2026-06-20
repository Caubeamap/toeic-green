const MINIMUM_SECRET_LENGTH = 32;

// Các giá trị secret từng được hardcode làm fallback trong mã nguồn (đã có trong
// git history) → công khai → phải bị từ chối ở MỌI môi trường, kể cả nếu ai đó
// vô tình đặt lại chúng vào .env.
const KNOWN_DEFAULT_SECRETS = new Set([
  'default_jwt_access_secret_2026',
  'default_jwt_refresh_secret_2026',
  // Placeholder công khai trong .env.example — dài >=32 nên không bị chặn bởi luật độ
  // dài; phải liệt kê tường minh để không ai vô tình ship bằng giá trị mẫu.
  'your_very_long_jwt_access_secret_key_2026',
  'your_very_long_jwt_refresh_secret_key_2026',
]);

export function validateEnvironment(config: Record<string, unknown>) {
  // Kiểm tra phổ quát (mọi môi trường): nếu một secret ĐƯỢC cung cấp thì nó phải
  // đủ mạnh và không phải giá trị default công khai. Khác với production, dev/test
  // không bắt buộc PHẢI có secret (đã fail-closed ở runtime khi thiếu), nhưng đã
  // có thì không được yếu/đoán được.
  assertSecretSafeIfPresent(config, 'JWT_SECRET');
  assertSecretSafeIfPresent(config, 'JWT_REFRESH_SECRET');

  if (
    typeof config.JWT_SECRET === 'string' &&
    config.JWT_SECRET === config.JWT_REFRESH_SECRET
  ) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  if (config.NODE_ENV !== 'production') {
    return config;
  }

  // Production: bắt buộc PHẢI có secret (không cho phép thiếu để fail-closed im lặng).
  const accessSecret = requireProductionSecret(config, 'JWT_SECRET');
  const refreshSecret = requireProductionSecret(config, 'JWT_REFRESH_SECRET');

  if (accessSecret === refreshSecret) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }

  requireProductionValue(config, 'EMAIL_FROM');
  validateMailProvider(config);

  // Hạ tầng bắt buộc ở production: thiếu các giá trị này hiện đang fail âm thầm
  // (config đọc với fallback hoặc undefined) → khởi động nhầm với cấu hình thiếu.
  // - DATABASE_URL: không có DB thì app vô dụng.
  // - REDIS_URL: thiếu → throttler tụt về in-memory per-instance → rate-limit KHÔNG
  //   chia sẻ giữa các instance khi scale (đúng yêu cầu nhiều người dùng đồng thời).
  // - R2_*: thiếu → upload/đọc media (avatar, ảnh/audio đề thi) hỏng.
  requireProductionValue(config, 'DATABASE_URL');
  requireProductionValue(config, 'REDIS_URL');
  requireProductionValue(config, 'R2_ACCOUNT_ID');
  requireProductionValue(config, 'R2_ACCESS_KEY');
  requireProductionValue(config, 'R2_SECRET_KEY');
  requireProductionValue(config, 'R2_BUCKET_NAME');
  requireProductionValue(config, 'R2_PUBLIC_URL');

  return config;
}

function assertSecretSafeIfPresent(
  config: Record<string, unknown>,
  name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET',
) {
  const value = config[name];
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value === 'string' && KNOWN_DEFAULT_SECRETS.has(value)) {
    throw new Error(
      `${name} must not use a known default value; set a unique strong secret`,
    );
  }

  if (typeof value !== 'string' || value.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `${name} must be at least ${MINIMUM_SECRET_LENGTH} characters`,
    );
  }
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
