import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Comment {
  @ApiProperty({ example: 'user-123' })
  @Prop({ required: true })
  userId!: string;

  @ApiProperty({ example: 'post-456' })
  @Prop({ required: true })
  postId!: string;

  @ApiProperty({ example: 'Great post!' })
  @Prop({ required: true })
  content!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @Prop({ required: true })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @Prop({ required: true })
  updatedAt!: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
