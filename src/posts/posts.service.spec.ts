import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostsService } from './posts.service';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let postModel: Model<Post>;

  const mockPost = {
    userId: 'user-123',
    title: 'Test Post',
    description: 'Test Description',
    imageUrls: ['https://example.com/image.jpg'],
    location: 'Test Location',
    likesCount: 0,
    save: jest.fn().mockResolvedValue({
      _id: 'post-123',
      ...mockPost,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken('Post'),
          useValue: {
            new: jest.fn().mockReturnValue(mockPost),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([mockPost]),
              }),
            }),
            findByIdAndDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postModel = module.get<Model<Post>>(getModelToken('Post'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const createPostDto: CreatePostDto = {
        title: 'New Post',
        description: 'New Description',
        imageUrls: ['https://example.com/new.jpg'],
        location: 'New Location',
      };

      const result = await service.create('user-123', createPostDto);

      expect(result).toEqual(mockPost);
      expect(postModel.new).toHaveBeenCalledWith({
        userId: 'user-123',
        ...createPostDto,
        likesCount: 0,
      });
    });
  });

  describe('findOne', () => {
    it('should return a post', async () => {
      const execMock = {
        exec: jest.fn().mockResolvedValue(mockPost),
      };
      postModel.findById = jest.fn().mockReturnValue({
        exec: execMock,
      } as any);

      const result = await service.findOne('post-123');

      expect(result).toEqual(mockPost);
      expect(postModel.findById).toHaveBeenCalledWith('post-123');
    });

    it('should throw NotFoundException if post does not exist', async () => {
      const execMock = {
        exec: jest.fn().mockResolvedValue(null),
      };
      postModel.findById = jest.fn().mockReturnValue({
        exec: execMock,
      } as any);

      await expect(service.findOne('post-123')).rejects.toThrow(
        new NotFoundException('Post not found'),
      );
    });
  });

  describe('findByUserId', () => {
    it('should return user posts sorted by date', async () => {
      const execMock = {
        exec: jest.fn().mockResolvedValue([mockPost]),
      };
      postModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: execMock,
        }),
      } as any);

      const result = await service.findByUserId('user-123');

      expect(result).toEqual([mockPost]);
      expect(postModel.find).toHaveBeenCalledWith({ userId: 'user-123' });
    });
  });

  describe('deleteOne', () => {
    it('should delete own post', async () => {
      const findExecMock = {
        exec: jest.fn().mockResolvedValue({
          userId: 'user-123',
          ...mockPost,
        }),
      };
      const deleteExecMock = {
        exec: jest.fn().mockResolvedValue(undefined),
      };

      postModel.findById = jest.fn().mockReturnValue({
        exec: findExecMock,
      } as any);
      postModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: deleteExecMock,
      } as any);

      await service.deleteOne('post-123', 'user-123');

      expect(postModel.findByIdAndDelete).toHaveBeenCalledWith('post-123');
    });

    it('should throw ForbiddenException if not owner', async () => {
      const findExecMock = {
        exec: jest.fn().mockResolvedValue({
          userId: 'other-user',  // Different owner
          ...mockPost,
        }),
      };

      postModel.findById = jest.fn().mockReturnValue({
        exec: findExecMock,
      } as any);

      await expect(
        service.deleteOne('post-123', 'user-123'),
      ).rejects.toThrow(new ForbiddenException('You can only delete your own posts'));
    });
  });

  describe('getPostsByUserIds', () => {
    it('should return posts from multiple users', async () => {
      const execMock = {
        exec: jest.fn().mockResolvedValue([mockPost]),
      };
      postModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: execMock,
        }),
      } as any);

      const result = await service.getPostsByUserIds(['user-1', 'user-2']);

      expect(result).toEqual([mockPost]);
      expect(postModel.find).toHaveBeenCalledWith({
        userId: { $in: ['user-1', 'user-2'] },
      });
    });
  });

  describe('incrementLikes', () => {
    it('should increment likes count', async () => {
      const updatedPost = { ...mockPost, likesCount: 1 };
      const findExecMock = {
        exec: jest.fn().mockResolvedValue({
          ...mockPost,
          save: jest.fn().mockResolvedValue(updatedPost),
        }),
      };

      postModel.findById = jest.fn().mockReturnValue({
        exec: findExecMock,
      } as any);

      const result = await service.incrementLikes('post-123');

      expect(result.likesCount).toBe(1);
    });
  });
});
