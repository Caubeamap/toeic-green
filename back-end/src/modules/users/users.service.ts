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
}
