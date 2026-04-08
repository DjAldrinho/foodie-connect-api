import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/create-comment.dto';
import { AuthenticatedRequest } from '../common/types/request.types';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post('posts/:postId')
  async createComment(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.create(
      req.user.userId,
      postId,
      createCommentDto,
    );
  }

  @Get('posts/:postId')
  async getPostComments(@Param('postId') postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @Get(':id')
  async getComment(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.update(id, req.user.userId, updateCommentDto);
  }

  @Delete(':id')
  async deleteComment(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.commentsService.delete(id, req.user.userId);
    return { message: 'Comment deleted successfully' };
  }

  @Post(':id/like')
  async likeComment(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.like(id, req.user.userId);
  }
}
