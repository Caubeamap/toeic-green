import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '2409', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:6868',
  env: process.env.NODE_ENV || 'development',
}));
