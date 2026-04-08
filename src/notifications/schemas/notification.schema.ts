import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  FOLLOW = 'FOLLOW',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  COMMENT_REPLY = 'COMMENT_REPLY',
  POST = 'POST',
}

@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class Notification {
  @Prop({ required: true })
  userId!: string; // Recipient

  @Prop({ required: true })
  type!: NotificationType;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ type: Object, required: false })
  data!: Record<string, any>; // { postId, commentId, userId, etc }

  @Prop({ default: false })
  isRead!: boolean;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for performance
NotificationSchema.index({ userId: 1, createdAt: -1 }); // User notifications
NotificationSchema.index({ userId: 1, isRead: 1 }); // Unread notifications
NotificationSchema.index({ type: 1, createdAt: -1 }); // By type
