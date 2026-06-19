import { Injectable } from '@nestjs/common';
import { normalizeEmail } from '../../common/utils/normalize-email';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
  }

  async findOneById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAuthIdentityById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
      },
    });
  }

  async findSessionById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        profile: {
          select: {
            userId: true,
            bio: true,
            bannerTone: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async create(email: string, passwordHash: string, displayName: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizeEmail(email),
          passwordHash,
          displayName,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          bannerTone: 'mint',
        },
      });

      return user;
    });
  }

  /** Tìm user theo tài khoản OAuth đã liên kết (composite unique provider+id). */
  async findByOAuthAccount(provider: string, providerUserId: string) {
    const account = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: { provider, providerUserId },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            status: true,
            emailVerifiedAt: true,
          },
        },
      },
    });

    return account?.user ?? null;
  }

  /**
   * Tạo user OAuth (không mật khẩu, email đã xác minh bởi provider) + profile +
   * bản ghi OAuthAccount, và xoá mọi pending registration cùng email (đăng ký mật
   * khẩu chưa hoàn tất bị thay thế). Tất cả trong MỘT transaction.
   *
   * Có thể ném Prisma P2002 nếu một request đồng thời vừa chiếm `email` hoặc cặp
   * `(provider, providerUserId)` — AuthService bắt lỗi này để re-read (race-safe).
   */
  async createWithOAuth(params: {
    email: string;
    displayName: string;
    avatarUrl: string | null;
    provider: string;
    providerUserId: string;
  }) {
    const email = normalizeEmail(params.email);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          displayName: params.displayName,
          avatarUrl: params.avatarUrl,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          bannerTone: 'mint',
        },
      });

      await tx.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: params.provider,
          providerUserId: params.providerUserId,
        },
      });

      await tx.pendingRegistration.deleteMany({ where: { email } });

      return user;
    });
  }
}
