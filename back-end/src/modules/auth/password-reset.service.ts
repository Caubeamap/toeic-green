import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { normalizeEmail } from '../../common/utils/normalize-email';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

const RESET_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async issue(email: string) {
    const normalized = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true, passwordHash: true },
    });

    const successMessage = {
      message:
        'Nếu email tồn tại trên hệ thống, mã xác nhận đặt lại mật khẩu đã được gửi.',
    };

    // Tài khoản đăng nhập bằng Google không có mật khẩu để đặt lại → no-op (vẫn
    // trả thông báo chung để không lộ thông tin và giữ chính sách 1 email 1 phương thức).
    if (!user || !user.passwordHash) {
      return successMessage;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = this.hashOtp(user.id, otp);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });
    });

    this.mailService.sendPasswordReset(user.email, otp).catch((error) => {
      this.logger.error(
        `Không thể gửi email đặt lại mật khẩu tới ${user.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    });

    return successMessage;
  }

  async verifyOtp(email: string, otp: string) {
    const normalizedEmail = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(
        'Mã OTP đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      );
    }

    const tokenHash = this.hashOtp(user.id, otp);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date()
    ) {
      throw new BadRequestException(
        'Mã OTP đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      );
    }

    return { success: true };
  }

  async reset(dto: ResetPasswordDto) {
    const { email, otp, password } = dto;
    const normalizedEmail = normalizeEmail(email);

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, emailVerifiedAt: true },
    });

    if (!user) {
      throw new BadRequestException(
        'Mã OTP đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      );
    }

    const tokenHash = this.hashOtp(user.id, otp);

    await this.prisma.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
        },
      });

      if (
        !resetToken ||
        resetToken.usedAt ||
        resetToken.expiresAt <= new Date()
      ) {
        throw new BadRequestException(
          'Mã OTP đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
        );
      }

      const consumed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (consumed.count !== 1) {
        throw new BadRequestException(
          'Mã OTP đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
        );
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const userUpdates: Record<string, unknown> = { passwordHash };
      if (!user.emailVerifiedAt) {
        userUpdates.emailVerifiedAt = new Date();
      }

      await tx.user.update({
        where: { id: user.id },
        data: userUpdates,
      });

      // Revoke all refresh sessions for the user
      await tx.refreshSession.deleteMany({
        where: { userId: user.id },
      });
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  private hashOtp(userId: string, otp: string) {
    return createHash('sha256').update(`${userId}_${otp}`).digest('hex');
  }
}
