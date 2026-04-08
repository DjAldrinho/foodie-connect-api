import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/request.types';

@ApiTags('posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<any> {
    return this.postsService.create(req.user.userId, createPostDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all posts from a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  async findByUser(@Param('userId') userId: string) {
    return this.postsService.findByUserId(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user posts' })
  @ApiResponse({ status: 200, description: 'Current user posts retrieved successfully' })
  async getMyPosts(@Request() req: AuthenticatedRequest) {
    return this.postsService.findByUserId(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post (only owner)' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your post' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.postsService.deleteOne(id, req.user.userId);
  }
}
