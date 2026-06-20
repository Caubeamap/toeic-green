import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '2409', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:6868',
  env: process.env.NODE_ENV || 'development',
  // Cookie `secure` không nên phụ thuộc cứng vào việc NODE_ENV có đúng chuỗi
  // 'production' hay không (staging/preview dễ quên đặt) → cho phép ép tường minh
  // qua COOKIE_SECURE; mặc định bật khi production.
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production',
  // Google Identity Services. Khi CLIENT_ID để trống, tính năng "Đăng nhập với
  // Google" bị tắt: frontend ẩn nút và endpoint /auth/google trả lỗi rõ ràng.
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  // Cần cho luồng authorization-code (nút tự vẽ): backend đổi `code` → token để
  // lấy id_token rồi xác minh. Luồng id-token cũ (credential) KHÔNG dùng secret này.
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
}));
