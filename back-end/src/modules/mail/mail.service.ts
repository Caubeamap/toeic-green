import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {}

  async sendEmailVerification(email: string, token: string) {
    const verificationUrl = new URL(
      this.configService.getOrThrow<string>('mail.verificationUrl'),
    );
    verificationUrl.searchParams.set('token', token);

    const provider = this.configService.get<string>('mail.provider');
    if (provider === 'smtp') {
      await this.sendWithSmtp(email, verificationUrl);
    } else if (provider === 'resend') {
      await this.sendWithResend(email, verificationUrl);
    } else {
      this.logger.log(`Email verification for ${email}: ${verificationUrl}`);
    }
  }

  private async sendWithSmtp(email: string, verificationUrl: URL) {
    const smtpUser = this.configService.getOrThrow<string>('mail.smtpUser');
    const transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('mail.smtpHost'),
      port: this.configService.getOrThrow<number>('mail.smtpPort'),
      secure: this.configService.getOrThrow<boolean>('mail.smtpSecure'),
      auth: {
        user: smtpUser,
        pass: this.configService.getOrThrow<string>('mail.smtpPassword'),
      },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });

    try {
      await transporter.sendMail({
        from: this.configService.get<string>('mail.from') || smtpUser,
        to: email,
        subject: 'Xác minh email TOEIC Green',
        html: this.buildVerificationHtml(verificationUrl),
      });
    } catch (error: unknown) {
      this.logger.error(
        'Could not send verification email through SMTP',
        error,
      );
      throw new BadGatewayException('Không thể gửi email xác minh');
    } finally {
      transporter.close();
    }
  }

  private async sendWithResend(email: string, verificationUrl: URL) {
    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.configService.getOrThrow<string>('mail.resendApiKey')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.configService.getOrThrow<string>('mail.from'),
          to: [email],
          subject: 'Xác minh email TOEIC Green',
          html: this.buildVerificationHtml(verificationUrl),
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error: unknown) {
      this.logger.error('Could not reach Resend', error);
      throw new BadGatewayException('Không thể gửi email xác minh');
    }

    if (!response.ok) {
      this.logger.error(
        `Resend rejected verification email with status ${response.status}`,
      );
      throw new BadGatewayException('Không thể gửi email xác minh');
    }
  }

  private buildVerificationHtml(verificationUrl: URL) {
    return [
      '<p>Chào mừng bạn đến với TOEIC Green.</p>',
      `<p><a href="${verificationUrl.toString()}">Xác minh địa chỉ email</a></p>`,
      '<p>Liên kết này sẽ hết hạn sau 24 giờ.</p>',
    ].join('');
  }
}
