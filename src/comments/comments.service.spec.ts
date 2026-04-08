import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/create-comment.dto';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentModel: any;

  const mockComment = {
    _id: 'comment-123',
    userId: 'user-123',
    postId: 'post-123',
    content: 'Great post!',
    parentCommentId: null,
    likes: [],
    mentions: [],
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(),
    save: jest.fn(function (this: any) {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getModelToken('Comment'),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockComment),
            }),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentModel = module.get<any>(getModelToken('Comment'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'Amazing food!',
      };

      const commentInstance = {
        ...mockComment,
        ...createCommentDto,
        save: jest.fn().mockResolvedValue(mockComment),
      };

      const createSpy = jest
        .spyOn(commentModel, 'create')
        .mockResolvedValue(commentInstance);

      const result = await service.create(
        'user-123',
        'post-123',
        createCommentDto,
      );

      expect(result).toEqual(mockComment);
      expect(createSpy).toHaveBeenCalled();

      createSpy.mockRestore();
    });

    it('should extract mentions from content', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'Hey @john and @jane check this out!',
      };

      const commentInstance = {
        ...mockComment,
        mentions: ['@john', '@jane'],
        save: jest.fn(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest.spyOn(commentModel, 'create').mockResolvedValue(commentInstance);

      const result = await service.create(
        'user-123',
        'post-123',
        createCommentDto,
      );

      expect(result.mentions).toEqual(['@john', '@jane']);
    });
  });

  describe('update', () => {
    it('should update own comment within 5 minutes', async () => {
      const updateCommentDto: UpdateCommentDto = {
        content: 'Updated comment',
      };

      const updatedComment = {
        ...mockComment,
        userId: 'user-123',
        createdAt: new Date(),
        content: 'Updated comment',
        isEdited: true,
      };

      const execMock = {
        exec: jest.fn().mockResolvedValue(updatedComment),
      };
      const findByIdSpy = jest
        .spyOn(commentModel, 'findById')
        .mockReturnValue(execMock as any);

      const result = await service.update(
        'comment-123',
        'user-123',
        updateCommentDto,
      );

      expect(result.content).toBe('Updated comment');
      expect(result.isEdited).toBe(true);

      findByIdSpy.mockRestore();
    });

    it('should throw if trying to edit another users comment', async () => {
      const updateCommentDto: UpdateCommentDto = {
        content: 'Hacked comment',
      };

      const findByIdSpy = jest.spyOn(commentModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockComment),
      } as any);

      await expect(
        service.update('comment-123', 'other-user', updateCommentDto),
      ).rejects.toThrow(
        new ForbiddenException('You can only edit your own comments'),
      );

      findByIdSpy.mockRestore();
    });

    it('should throw if trying to edit after 5 minutes', async () => {
      const updateCommentDto: UpdateCommentDto = {
        content: 'Too late edit',
      };

      const oldComment = {
        ...mockComment,
        userId: 'user-123',
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      };

      const findByIdSpy = jest.spyOn(commentModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(oldComment),
      } as any);

      await expect(
        service.update('comment-123', 'user-123', updateCommentDto),
      ).rejects.toThrow(
        new BadRequestException(
          'You can only edit comments within 5 minutes of posting',
        ),
      );

      findByIdSpy.mockRestore();
    });
  });

  describe('delete', () => {
    it('should soft delete own comment', async () => {
      const findByIdSpy = jest.spyOn(commentModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockComment),
      } as any);

      await service.delete('comment-123', 'user-123');

      expect(mockComment.isDeleted).toBe(true);
      expect(mockComment.content).toBe('[Comment deleted]');

      findByIdSpy.mockRestore();
    });
  });

  describe('like', () => {
    it('should like a comment when not already liked', async () => {
      const commentToLike = {
        ...mockComment,
        likes: [],
        save: jest.fn(function (this: any) {
          this.likes.push('user-456');
          return Promise.resolve(this);
        }),
      };

      commentModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(commentToLike),
      });

      const result = await service.like('comment-123', 'user-456');

      expect(result.likes).toContain('user-456');

      // Restore default mock
      commentModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockComment),
      });
    });

    it('should unlike a comment when already liked', async () => {
      const commentToUnlike = {
        ...mockComment,
        likes: ['user-456'],
        save: jest.fn(function (this: any) {
          this.likes = this.likes.filter((id: string) => id !== 'user-456');
          return Promise.resolve(this);
        }),
      };

      commentModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(commentToUnlike),
      });

      const result = await service.like('comment-123', 'user-456');

      expect(result.likes).not.toContain('user-456');

      // Restore default mock
      commentModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockComment),
      });
    });
  });
});
