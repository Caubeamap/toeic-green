import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(email: string, passwordHash: string, displayName: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          displayName,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          targetScore: 450,
          currentLevel: 'BEGINNER',
          bannerTone: 'mint',
          studyHoursPerWeek: 5,
        },
      });

      return user;
    });
  }
}
