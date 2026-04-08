import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';
import { NotificationType } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationModel: any;

  const mockNotification = {
    _id: 'notif-123',
    userId: 'user-123',
    type: NotificationType.LIKE,
    title: 'New like',
    message: 'Someone liked your post',
    data: { postId: 'post-123', likerId: 'user-456' },
    isRead: false,
    readAt: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken('Notification'),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            countDocuments: jest.fn(),
            updateMany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationModel = module.get<any>(getModelToken('Notification'));
  });

  it('should be defined', () => {
    expect(service).toBeTruthy();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const createNotificationDto: CreateNotificationDto = {
        userId: 'user-123',
        type: NotificationType.LIKE,
        title: 'New like',
        message: 'Someone liked your post',
        data: { postId: 'post-123' },
      };

      const createSpy = jest
        .spyOn(notificationModel, 'create')
        .mockResolvedValue({
          ...mockNotification,
          save: jest.fn().mockResolvedValue(mockNotification),
        } as any);

      const result = await service.create(createNotificationDto);

      expect(result).toEqual(mockNotification);
      expect(createSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        type: NotificationType.LIKE,
        title: 'New like',
        message: 'Someone liked your post',
        data: { postId: 'post-123' },
      });

      createSpy.mockRestore();
    });
  });

  describe('findByUser', () => {
    it('should return user notifications', async () => {
      const options: GetNotificationsDto = {
        page: 1,
        limit: 10,
        unreadOnly: true,
      };

      const notifications = [mockNotification];
      const count = 5;

      const execMock = jest.fn().mockResolvedValue(notifications);
      const limitMock = jest.fn().mockReturnValue({ exec: execMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
      const findSpy = jest
        .spyOn(notificationModel, 'find')
        .mockReturnValue({ sort: sortMock } as any);

      const countSpy = jest
        .spyOn(notificationModel, 'countDocuments')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(count) } as any);

      const result = await service.findByUser('user-123', options);

      expect(result.notifications).toEqual(notifications);
      expect(result.total).toEqual(count);

      findSpy.mockRestore();
      countSpy.mockRestore();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const findByIdSpy = jest
        .spyOn(notificationModel, 'findById')
        .mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockNotification),
        } as any);

      const result = await service.markAsRead('notif-123', 'user-123');

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeInstanceOf(Date);

      findByIdSpy.mockRestore();
    });

    it('should throw if notification not found', async () => {
      const findByIdSpy = jest
        .spyOn(notificationModel, 'findById')
        .mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        } as any);

      await expect(
        service.markAsRead('notif-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);

      findByIdSpy.mockRestore();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const count = 3;

      const execMock = {
        exec: jest.fn().mockResolvedValue(count),
      };
      const countSpy = jest
        .spyOn(notificationModel, 'countDocuments')
        .mockReturnValue(execMock as any);

      const result = await service.getUnreadCount('user-123');

      expect(result).toEqual(3);

      countSpy.mockRestore();
    });
  });
});
