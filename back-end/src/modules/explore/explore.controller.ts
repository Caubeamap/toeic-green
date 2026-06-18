import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RateWordDto } from './dto/rate-word.dto';
import { SetSavedDto } from './dto/set-saved.dto';
import { ExploreService } from './explore.service';

@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Public()
  @Get('collections')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async listCollections() {
    return this.exploreService.listCollections();
  }

  @Public()
  @Get('collections/:slug')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  async getCollection(@Param('slug') slug: string) {
    return this.exploreService.getCollection(slug);
  }

  /* ──────────── Protected: per-user learning progress ──────────── */

  @Get('collections/:slug/progress')
  async getCollectionProgress(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
  ) {
    return this.exploreService.getCollectionProgress(userId, slug);
  }

  @Put('words/:wordId/rating')
  async rateWord(
    @CurrentUser('id') userId: string,
    @Param('wordId') wordId: string,
    @Body() dto: RateWordDto,
  ) {
    return this.exploreService.rateWord(userId, wordId, dto.rating);
  }

  @Delete('collections/:slug/known')
  async resetKnownRatings(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
  ) {
    return this.exploreService.resetKnownRatings(userId, slug);
  }

  @Put('collections/:slug/saved')
  async setSaved(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Body() dto: SetSavedDto,
  ) {
    return this.exploreService.setSaved(userId, slug, dto.isSaved);
  }
}
