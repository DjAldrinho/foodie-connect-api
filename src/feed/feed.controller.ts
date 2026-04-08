import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/request.types';

@ApiTags('feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get personalized feed (posts from followed users)' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFeed(
    @Query() query: FeedQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.feedService.getUserFeed(req.user.userId, query);
  }
}
