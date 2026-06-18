import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  // KHÔNG đặt fallback hardcoded cho secret: một secret công khai trong mã nguồn
  // cho phép giả mạo token cho bất kỳ user/role nào. Thiếu env → fail closed
  // (ký/verify lỗi) thay vì âm thầm chạy bằng secret ai cũng biết.
  // env.validation.ts đảm bảo secret tồn tại & đủ mạnh trước khi app khởi động.
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
