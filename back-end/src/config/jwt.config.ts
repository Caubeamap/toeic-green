import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'default_jwt_access_secret_2026',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_2026',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
