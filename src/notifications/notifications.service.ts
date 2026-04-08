import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel('Notification')
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.notificationModel.create(dto);
    return notification.save();
  }

  async findByUser(
    userId: string,
    options: GetNotificationsDto,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 20, type, unreadOnly = false } = options;

    const query: any = { userId, isDeleted: false };

    if (type) {
      query.type = type;
    }

    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;

    const notifications = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.notificationModel.countDocuments(query).exec();

    return { notifications, total };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationModel
      .findById(notificationId)
      .exec();

    if (!notification || notification.isDeleted) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return notification.save();
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel
      .updateMany(
        { userId, isRead: false, isDeleted: false },
        { isRead: true, readAt: new Date() },
      )
      .exec();

    return { modifiedCount: result.modifiedCount || 0 };
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationModel
      .findById(notificationId)
      .exec();

    if (!notification || notification.isDeleted) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    notification.isDeleted = true;
    await notification.save();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({
        userId,
        isRead: false,
        isDeleted: false,
      })
      .exec();
  }

  // Helper methods to create different notification types
  async notifyFollow(
    followerId: string,
    followedUserId: string,
  ): Promise<void> {
    await this.create({
      userId: followerId,
      type: NotificationType.FOLLOW,
      title: 'New follower',
      message: 'Someone started following you',
      data: { userId: followedUserId },
    });
  }

  async notifyLike(
    userId: string,
    postId: string,
    likerId: string,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.LIKE,
      title: 'New like',
      message: 'Someone liked your post',
      data: { postId, likerId },
    });
  }

  async notifyComment(
    userId: string,
    postId: string,
    commenterId: string,
    commentContent: string,
  ): Promise<void> {
    await this.create({
      userId,
      type: NotificationType.COMMENT,
      title: 'New comment',
      message: `Someone commented: "${commentContent.substring(0, 50)}..."`,
      data: { postId, commenterId },
    });
  }
}
