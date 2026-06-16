import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SubmitPracticeAttemptDto } from './dto/submit-practice-attempt.dto';
import { PracticeService } from './practice.service';

@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Public()
  @Get('tests')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async listTests() {
    return this.practiceService.listTests();
  }

  @Public()
  @Get('tests/:slug')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async getTest(@Param('slug') slug: string) {
    return this.practiceService.getTestBySlug(slug);
  }

  @Get('attempts/recent')
  async listRecentAttempts(@CurrentUser('id') userId: string) {
    return this.practiceService.listRecentAttempts(userId);
  }

  @Get('tests/:slug/questions')
  async listQuestions(@Param('slug') slug: string) {
    return this.practiceService.listQuestions(slug);
  }

  @Post('tests/:slug/attempts')
  async submitAttempt(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Body() submitAttemptDto: SubmitPracticeAttemptDto,
  ) {
    return this.practiceService.submitAttempt(userId, slug, submitAttemptDto);
  }

  @Get('tests/:slug/attempts/latest')
  async getLatestAttempt(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
  ) {
    return this.practiceService.getLatestAttemptResult(userId, slug);
  }

  @Get('tests/:slug/attempts/:attemptId')
  async getAttempt(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.practiceService.getAttemptResult(userId, slug, attemptId);
  }
}
