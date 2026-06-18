import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import {
  buildEmailVerificationTemplate,
  buildPasswordResetTemplate,
  TransactionalEmailTemplate,
} from './email-templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {}

  async sendEmailVerification(email: string, token: string) {
    const verificationUrl = new URL(
      this.configService.getOrThrow<string>('mail.verificationUrl'),
    );
    verificationUrl.searchParams.set('token', token);

    const template = buildEmailVerificationTemplate({
      verificationUrl: verificationUrl.toString(),
    });

    const provider = this.configService.get<string>('mail.provider');
    if (provider === 'smtp') {
      await this.sendWithSmtp(
        email,
        template,
        'verification email',
        'Không thể gửi email xác minh',
      );
    } else if (provider === 'resend') {
      await this.sendWithResend(
        email,
        template,
        'verification email',
        'Không thể gửi email xác minh',
      );
    } else {
      this.logger.log(`Email verification for ${email}: ${verificationUrl}`);
    }
  }

  async sendPasswordReset(email: string, otp: string) {
    const template = buildPasswordResetTemplate({
      otp,
    });

    const provider = this.configService.get<string>('mail.provider');
    if (provider === 'smtp') {
      await this.sendWithSmtp(
        email,
        template,
        'reset password email',
        'Không thể gửi email đặt lại mật khẩu',
      );
    } else if (provider === 'resend') {
      await this.sendWithResend(
        email,
        template,
        'reset password email',
        'Không thể gửi email đặt lại mật khẩu',
      );
    } else {
      this.logger.log(`Password reset OTP for ${email}: ${otp}`);
    }
  }

  private async sendWithSmtp(
    email: string,
    template: TransactionalEmailTemplate,
    logLabel: string,
    failureMessage: string,
  ) {
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
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error: unknown) {
      this.logger.error(`Could not send ${logLabel} through SMTP`, error);
      throw new BadGatewayException(failureMessage);
    } finally {
      transporter.close();
    }
  }

  private async sendWithResend(
    email: string,
    template: TransactionalEmailTemplate,
    logLabel: string,
    failureMessage: string,
  ) {
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
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error: unknown) {
      this.logger.error('Could not reach Resend', error);
      throw new BadGatewayException(failureMessage);
    }

    if (!response.ok) {
      this.logger.error(
        `Resend rejected ${logLabel} with status ${response.status}`,
      );
      throw new BadGatewayException(failureMessage);
    }
  }
}
