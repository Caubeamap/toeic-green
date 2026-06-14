import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ cá nhân');
    }

    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Kiểm tra xem profile có tồn tại không trước khi update
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ cá nhân để cập nhật');
    }

    return this.prisma.userProfile.update({
      where: { userId },
      data: updateProfileDto,
      include: {
        user: {
          select: {
            email: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });
  }
}
