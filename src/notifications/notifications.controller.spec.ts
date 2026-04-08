import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { NotificationType } from './schemas/notification.schema';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockRequest = {
    user: { userId: 'user-123' },
  };

  const mockNotification = {
    _id: 'notif-123',
    userId: 'user-123',
    type: NotificationType.LIKE,
    title: 'New like',
    message: 'Someone liked your post',
    data: { postId: 'post-123' },
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            findByUser: jest.fn().mockResolvedValue({
              notifications: [mockNotification],
              total: 5,
            }),
            markAsRead: jest.fn().mockResolvedValue(mockNotification),
            markAllAsRead: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
            delete: jest.fn().mockResolvedValue(undefined),
            getUnreadCount: jest.fn().mockResolvedValue(3),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should return user notifications', async () => {
      const query: GetNotificationsDto = {
        page: 1,
        limit: 10,
        unreadOnly: true,
      };

      service.findByUser = jest.fn().mockResolvedValue({
        notifications: [mockNotification],
        total: 5,
      });

      const result = await controller.getNotifications(
        mockRequest as any,
        query,
      );

      expect(service.findByUser).toHaveBeenCalledWith('user-123', query);
      expect(result).toEqual({ notifications: [mockNotification], total: 5 });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      service.getUnreadCount = jest.fn().mockResolvedValue(3);

      const result = await controller.getUnreadCount(mockRequest as any);

      expect(service.getUnreadCount).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      service.markAsRead = jest.fn().mockResolvedValue(mockNotification);

      const result = await controller.markAsRead(
        'notif-123',
        mockRequest as any,
      );

      expect(service.markAsRead).toHaveBeenCalledWith('notif-123', 'user-123');
      expect(result).toEqual(mockNotification);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      service.delete = jest.fn().mockResolvedValue(undefined);

      const result = await controller.deleteNotification(
        'notif-123',
        mockRequest as any,
      );

      expect(service.delete).toHaveBeenCalledWith('notif-123', 'user-123');
      expect(result).toEqual({ message: 'Notification deleted successfully' });
    });
  });
});
