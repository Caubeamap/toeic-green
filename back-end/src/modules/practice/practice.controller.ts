import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { SubmitPracticeAttemptDto } from './dto/submit-practice-attempt.dto';
import { PracticeService } from './practice.service';

@Controller('practice')
export class PracticeController {
  constructor(
    private readonly practiceService: PracticeService,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Get('tests')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async listTests() {
    return this.practiceService.listTests();
  }

  @Get('tests/me')
  async listTestsForCurrentUser(@CurrentUser('id') userId: string) {
    return this.practiceService.listTestsForUser(userId);
  }

  @Public()
  @Get('tests/bootstrap')
  async listTestsForBootstrap(@Req() request: Request) {
    const refreshToken = this.getRefreshToken(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token');
    }

    const session = await this.authService.bootstrap(refreshToken);
    return this.practiceService.listTestsForUser(session.user.id);
  }

  @Public()
  @Get('tests/:slug/questions/bootstrap')
  @Header('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
  async listQuestionsForBootstrap(
    @Req() request: Request,
    @Param('slug') slug: string,
  ) {
    const refreshToken = this.getRefreshToken(request);
    if (!refreshToken) {
      throw new UnauthorizedException('KhÃ´ng tÃ¬m tháº¥y Refresh Token');
    }

    await this.authService.bootstrap(refreshToken);
    return this.practiceService.listQuestions(slug);
  }

  @Public()
  @Get('tests/:slug')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async getTest(@Param('slug') slug: string) {
    return this.practiceService.getTestBySlug(slug);
  }

  @Get('tests/:slug/progress')
  async getTestForCurrentUser(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
  ) {
    return this.practiceService.getTestBySlugForUser(userId, slug);
  }

  @Get('attempts/recent')
  async listRecentAttempts(@CurrentUser('id') userId: string) {
    return this.practiceService.listRecentAttempts(userId);
  }

  @Get('stats/me')
  async getUserStats(@CurrentUser('id') userId: string) {
    return this.practiceService.getUserStats(userId);
  }

  @Get('tests/:slug/questions')
  @Header('Cache-Control', 'private, max-age=300, stale-while-revalidate=600')
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

  private getRefreshToken(request: Request) {
    const requestCookies = request.cookies as
      | Record<string, string>
      | undefined;

    return requestCookies?.refresh_token;
  }
}
