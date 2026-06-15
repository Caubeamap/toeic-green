import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { normalizeEmail } from '../../common/utils/normalize-email';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async issue(userId: string, email: string) {
    const token = randomBytes(32).toString('hex');

    await this.prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.deleteMany({ where: { userId } });
      await tx.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        },
      });
    });

    this.mailService.sendEmailVerification(email, token).catch((error) => {
      this.logger.error(
        `Không thể gửi email xác minh tới ${email}`,
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  async resend(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { id: true, email: true, emailVerifiedAt: true },
    });

    if (user && !user.emailVerifiedAt) {
      await this.issue(user.id, user.email);
    }

    return {
      message:
        'Nếu tài khoản tồn tại và chưa xác minh, email xác minh mới đã được gửi.',
    };
  }

  async verify(token: string) {
    const tokenHash = this.hashToken(token);

    await this.prisma.$transaction(async (tx) => {
      const verificationToken = await tx.emailVerificationToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
        },
      });

      if (
        !verificationToken ||
        verificationToken.usedAt ||
        verificationToken.expiresAt <= new Date()
      ) {
        throw new BadRequestException(
          'Token xác minh không hợp lệ hoặc đã hết hạn',
        );
      }

      const consumed = await tx.emailVerificationToken.updateMany({
        where: {
          id: verificationToken.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (consumed.count !== 1) {
        throw new BadRequestException(
          'Token xác minh không hợp lệ hoặc đã hết hạn',
        );
      }

      await tx.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: new Date() },
      });
    });

    return { message: 'Xác minh email thành công' };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
