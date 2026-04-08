import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel('Comment') private commentModel: Model<CommentDocument>,
  ) {}

  async create(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    // Extract mentions from content (@username)
    const mentions = this.extractMentions(createCommentDto.content);

    const comment = await this.commentModel.create({
      userId,
      postId,
      ...createCommentDto,
      mentions,
    });

    return comment.save();
  }

  async findByPost(postId: string): Promise<Comment[]> {
    return this.commentModel
      .find({ postId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(commentId: string): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async update(
    commentId: string,
    userId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId).exec();

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    // Check ownership
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Check time limit (5 minutes)
    const now = new Date();
    const commentTime = comment.createdAt as Date;
    const diffInMinutes = (now.getTime() - commentTime.getTime()) / 60000;

    if (diffInMinutes > 5) {
      throw new BadRequestException(
        'You can only edit comments within 5 minutes of posting',
      );
    }

    comment.content = updateCommentDto.content;
    comment.isEdited = true;
    comment.mentions = this.extractMentions(updateCommentDto.content);

    return comment.save();
  }

  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentModel.findById(commentId).exec();

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    // Check ownership
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete
    comment.isDeleted = true;
    comment.content = '[Comment deleted]';
    await comment.save();
  }

  async like(commentId: string, userId: string): Promise<Comment> {
    const comment = await this.commentModel.findById(commentId).exec();

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.likes.includes(userId)) {
      // Unlike
      comment.likes = comment.likes.filter((id) => id !== userId);
    } else {
      // Like
      comment.likes.push(userId);
    }

    return comment.save();
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(content)) !== null) {
      matches.push(match[0]);
    }
    return matches;
  }
}
