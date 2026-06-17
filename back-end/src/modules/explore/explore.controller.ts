import { Controller, Get, Header, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
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
}
