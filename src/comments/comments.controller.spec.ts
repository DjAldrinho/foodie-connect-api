import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;

  const mockComment = {
    _id: 'comment-123',
    userId: 'user-123',
    postId: 'post-123',
    content: 'Great post!',
    createdAt: new Date(),
  };

  const mockRequest = {
    user: { userId: 'user-123' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockComment),
            findByPost: jest.fn().mockResolvedValue([mockComment]),
            findOne: jest.fn().mockResolvedValue(mockComment),
            update: jest.fn().mockResolvedValue(mockComment),
            delete: jest.fn().mockResolvedValue(undefined),
            like: jest.fn().mockResolvedValue(mockComment),
          },
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'Amazing food!',
      };

      const result = await controller.createComment(
        'post-123',
        createCommentDto,
        mockRequest,
      );

      expect(result).toEqual(mockComment);
      expect(service.create).toHaveBeenCalledWith(
        'user-123',
        'post-123',
        createCommentDto,
      );
    });
  });

  describe('getPostComments', () => {
    it('should return comments for a post', async () => {
      const result = await controller.getPostComments('post-123');

      expect(result).toEqual([mockComment]);
      expect(service.findByPost).toHaveBeenCalledWith('post-123');
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const updateCommentDto = { content: 'Updated!' };

      const result = await controller.updateComment(
        'comment-123',
        updateCommentDto,
        mockRequest,
      );

      expect(result).toEqual(mockComment);
      expect(service.update).toHaveBeenCalledWith(
        'comment-123',
        'user-123',
        updateCommentDto,
      );
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const result = await controller.deleteComment('comment-123', mockRequest);

      expect(result).toEqual({ message: 'Comment deleted successfully' });
      expect(service.delete).toHaveBeenCalledWith('comment-123', 'user-123');
    });
  });

  describe('likeComment', () => {
    it('should like a comment', async () => {
      const result = await controller.likeComment('comment-123', mockRequest);

      expect(result).toEqual(mockComment);
      expect(service.like).toHaveBeenCalledWith('comment-123', 'user-123');
    });
  });
});
