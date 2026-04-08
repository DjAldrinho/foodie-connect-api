import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FollowsService } from './follows.service';
import { FollowUserDto, GetFollowsQueryDto } from './dto/follow-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/request.types';

@ApiTags('follows')
@Controller('follow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FollowsController {
  constructor(private followsService: FollowsService) {}

  @Post(':userId')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'userId', description: 'User ID to follow' })
  @ApiResponse({ status: 201, description: 'User followed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request (self-follow or already follows)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async follow(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.followsService.follow(req.user.userId, userId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'userId', description: 'User ID to unfollow' })
  @ApiResponse({ status: 204, description: 'User unfollowed successfully' })
  @ApiResponse({ status: 404, description: 'Follow relationship not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unfollow(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.followsService.unfollow(req.user.userId, userId);
  }

  @Get('following')
  @ApiOperation({ summary: 'Get list of users followed by current user' })
  @ApiResponse({ status: 200, description: 'List of following user IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowing(
    @Request() req: AuthenticatedRequest,
    @Query() query: GetFollowsQueryDto,
  ) {
    return this.followsService.getFollowingIds(
      req.user.userId,
      query.page,
      query.limit,
    );
  }

  @Get('followers')
  @ApiOperation({ summary: 'Get list of followers of current user' })
  @ApiResponse({ status: 200, description: 'List of follower user IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFollowers(
    @Request() req: AuthenticatedRequest,
    @Query() query: GetFollowsQueryDto,
  ) {
    return this.followsService.getFollowersIds(
      req.user.userId,
      query.page,
      query.limit,
    );
  }
}
