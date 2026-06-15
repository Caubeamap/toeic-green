import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  provider: process.env.MAIL_PROVIDER || 'log',
  resendApiKey: process.env.RESEND_API_KEY,
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpSecure: process.env.SMTP_SECURE !== 'false',
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_APP_PASSWORD,
  from: process.env.EMAIL_FROM,
  verificationUrl:
    process.env.EMAIL_VERIFICATION_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:6868'}/verify-email`,
  resetPasswordUrl:
    process.env.EMAIL_RESET_PASSWORD_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:6868'}/reset-password`,
}));
