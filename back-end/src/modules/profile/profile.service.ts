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

    const { displayName, avatarUrl, ...profileData } = updateProfileDto;

    // 1. Cập nhật thông tin User nếu có thay đổi
    if (displayName !== undefined || avatarUrl !== undefined) {
      const userData: { displayName?: string; avatarUrl?: string } = {};
      if (displayName !== undefined) userData.displayName = displayName;
      if (avatarUrl !== undefined) userData.avatarUrl = avatarUrl;

      await this.prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    // 2. Cập nhật thông tin UserProfile và trả về kết quả
    return this.prisma.userProfile.update({
      where: { userId },
      data: profileData,
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
