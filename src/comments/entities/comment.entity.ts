import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({
  timestamps: true,
  collection: 'comments',
})
export class Comment {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  postId!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: String, default: null })
  parentCommentId!: string | null; // For nested replies

  @Prop({ type: [String], default: [] })
  likes!: string[]; // Array of userIds who liked

  @Prop({ type: [String], default: [] })
  mentions!: string[]; // User IDs mentioned with @

  @Prop({ default: false })
  isEdited!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean; // Soft delete

  @Prop({ required: true })
  createdAt!: Date;

  @Prop({ required: true })
  updatedAt!: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes for performance
CommentSchema.index({ postId: 1, createdAt: -1 }); // Comments for a post
CommentSchema.index({ userId: 1, createdAt: -1 }); // User's comment history
CommentSchema.index({ parentCommentId: 1 }); // Nested replies
