import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel('Post') private postModel: Model<Post>,
  ) {}

  async findOne(postId: string): Promise<Post> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const newPost = await this.postModel.create({
      userId,
      ...createPostDto,
      likesCount: 0,
    });
    return newPost.save();
  }

  async findByUserId(userId: string): Promise<Post[]> {
    return this.postModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async deleteOne(postId: string, userId: string): Promise<void> {
    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postModel.findByIdAndDelete(postId).exec();
  }

  async getPostsByUserIds(userIds: string[]): Promise<Post[]> {
    return this.postModel
      .find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async incrementLikes(postId: string): Promise<Post> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.likesCount += 1;
    return post.save();
  }
}
