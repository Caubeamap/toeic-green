import { Module } from '@nestjs/common';
import { ProfileAvatarStorage } from './profile-avatar.storage';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileAvatarStorage, ProfileService],
})
export class ProfileModule {}
