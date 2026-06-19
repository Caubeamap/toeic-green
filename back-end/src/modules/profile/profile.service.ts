import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  AvatarUploadFile,
  ProfileAvatarStorage,
} from './profile-avatar.storage';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private avatarStorage: ProfileAvatarStorage,
  ) {}

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

    const { displayName, ...profileData } = updateProfileDto;

    // 1. Cập nhật thông tin User nếu có thay đổi
    if (displayName !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { displayName },
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

  async uploadAvatar(userId: string, file: AvatarUploadFile | undefined) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn ảnh đại diện.');
    }

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            avatarUrl: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ cá nhân để cập nhật');
    }

    const previousAvatarUrl = profile.user.avatarUrl;
    const nextAvatarUrl = await this.avatarStorage.upload(userId, file);

    try {
      const updatedProfile = await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { avatarUrl: nextAvatarUrl },
        });

        return tx.userProfile.update({
          where: { userId },
          data: { updatedAt: new Date() },
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
      });

      void this.avatarStorage.deleteIfOwnedByUser(userId, previousAvatarUrl);

      return updatedProfile;
    } catch (error) {
      await this.avatarStorage.deleteIfOwnedByUser(userId, nextAvatarUrl);
      throw error;
    }
  }
}
