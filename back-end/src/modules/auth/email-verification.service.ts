import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
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

  async hasPending(email: string) {
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { email: normalizeEmail(email) },
      select: { expiresAt: true },
    });

    return Boolean(pending && pending.expiresAt > new Date());
  }

  async issuePendingRegistration(
    email: string,
    passwordHash: string,
    displayName: string,
  ) {
    const normalizedEmail = normalizeEmail(email);
    const token = randomBytes(32).toString('hex');

    await this.prisma.$transaction(async (tx) => {
      await tx.pendingRegistration.deleteMany({
        where: {
          email: normalizedEmail,
          expiresAt: { lte: new Date() },
        },
      });
      await tx.pendingRegistration.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          displayName,
          tokenHash: this.hashToken(token),
          expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
        },
      });
    });

    this.mailService
      .sendEmailVerification(normalizedEmail, token)
      .catch((error) => {
        this.logger.error(
          `Không thể gửi email xác minh tới ${normalizedEmail}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

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
    const normalizedEmail = normalizeEmail(email);
    const pending = await this.prisma.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
      select: {
        email: true,
        passwordHash: true,
        displayName: true,
        expiresAt: true,
      },
    });

    if (pending) {
      if (pending.expiresAt > new Date()) {
        await this.prisma.pendingRegistration.delete({
          where: { email: normalizedEmail },
        });
        await this.issuePendingRegistration(
          pending.email,
          pending.passwordHash,
          pending.displayName,
        );
      } else {
        await this.prisma.pendingRegistration.delete({
          where: { email: normalizedEmail },
        });
      }
    }

    return {
      message:
        'Nếu tài khoản tồn tại và chưa xác minh, email xác minh mới đã được gửi.',
    };
  }

  async verify(token: string) {
    const tokenHash = this.hashToken(token);
    const verifiedPending = await this.verifyPendingRegistration(tokenHash);
    if (verifiedPending) {
      return { message: 'Xác minh email thành công' };
    }

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

  private async verifyPendingRegistration(tokenHash: string) {
    return this.prisma.$transaction(async (tx) => {
      const pending = await tx.pendingRegistration.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          displayName: true,
          expiresAt: true,
        },
      });

      if (!pending) {
        return false;
      }

      if (pending.expiresAt <= new Date()) {
        throw new BadRequestException(
          'Token xác minh không hợp lệ hoặc đã hết hạn',
        );
      }

      const existingUser = await tx.user.findUnique({
        where: { email: pending.email },
        select: { id: true },
      });
      if (existingUser) {
        await tx.pendingRegistration.delete({ where: { id: pending.id } });
        throw new ConflictException('Email này đã được sử dụng');
      }

      const consumed = await tx.pendingRegistration.deleteMany({
        where: {
          id: pending.id,
          tokenHash,
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1) {
        throw new BadRequestException(
          'Token xác minh không hợp lệ hoặc đã hết hạn',
        );
      }

      const user = await tx.user.create({
        data: {
          email: pending.email,
          passwordHash: pending.passwordHash,
          displayName: pending.displayName,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          bannerTone: 'mint',
        },
      });

      return true;
    });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
