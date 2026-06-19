import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('practice/tests/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get()
  async list(
    @Param('slug') slug: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('replyPreviewLimit') replyPreviewLimit?: string,
  ) {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    const parsedReplyPreviewLimit =
      replyPreviewLimit !== undefined ? Number(replyPreviewLimit) : undefined;
    return this.commentsService.list(slug, {
      cursor: cursor || undefined,
      limit:
        parsedLimit !== undefined && Number.isFinite(parsedLimit)
          ? parsedLimit
          : undefined,
      replyPreviewLimit:
        parsedReplyPreviewLimit !== undefined &&
        Number.isFinite(parsedReplyPreviewLimit)
          ? parsedReplyPreviewLimit
          : undefined,
    });
  }

  @Public()
  @Get(':commentId/replies')
  async listReplies(
    @Param('slug') slug: string,
    @Param('commentId') commentId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    return this.commentsService.listReplies(slug, commentId, {
      cursor: cursor || undefined,
      limit:
        parsedLimit !== undefined && Number.isFinite(parsedLimit)
          ? parsedLimit
          : undefined,
    });
  }

  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, slug, dto);
  }
}
