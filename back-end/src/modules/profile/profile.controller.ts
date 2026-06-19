import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { AvatarUploadFile } from './profile-avatar.storage';
import {
  isAllowedAvatarMimeType,
  MAX_AVATAR_UPLOAD_BYTES,
} from './profile-avatar.storage';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Patch()
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, updateProfileDto);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: {
        fields: 0,
        fileSize: MAX_AVATAR_UPLOAD_BYTES,
        files: 1,
      },
      fileFilter: (
        _request: unknown,
        file: Pick<AvatarUploadFile, 'mimetype' | 'originalname'>,
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        if (!isAllowedAvatarMimeType(file.mimetype)) {
          callback(
            new BadRequestException(
              'Ảnh đại diện chỉ hỗ trợ JPEG, PNG hoặc WebP.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: AvatarUploadFile,
  ) {
    return this.profileService.uploadAvatar(userId, file);
  }
}
