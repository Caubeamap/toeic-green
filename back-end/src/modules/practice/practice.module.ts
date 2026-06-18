import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';

@Module({
  imports: [AuthModule],
  controllers: [PracticeController],
  providers: [PracticeService],
})
export class PracticeModule {}
