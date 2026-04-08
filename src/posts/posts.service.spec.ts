import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PostsService } from './posts.service';
import { Post } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;
  let postModel: any;

  const mockPost = {
    _id: 'post-123',
    userId: 'user-123',
    title: 'Test Post',
    description: 'Test Description',
    imageUrls: ['https://example.com/image.jpg'],
    location: 'Test Location',
    likesCount: 0,
    save: jest.fn().mockResolvedValue({
      _id: 'post-123',
      userId: 'user-123',
      title: 'Test Post',
      description: 'Test Description',
      imageUrls: ['https://example.com/image.jpg'],
      location: 'Test Location',
      likesCount: 0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken('Post'),
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postModel = module.get<any>(getModelToken('Post'));
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

      const savedPost = { _id: 'post-123', userId: 'user-123', ...createPostDto, likesCount: 0 };
      const postInstance = {
        ...savedPost,
        save: jest.fn().mockResolvedValue(savedPost),
      };

      const createSpy = jest.spyOn(postModel, 'create').mockResolvedValue(postInstance as any);

      const result = await service.create('user-123', createPostDto);

      expect(result).toEqual(savedPost);
      expect(createSpy).toHaveBeenCalledWith({
        userId: 'user-123',
        ...createPostDto,
        likesCount: 0,
      });

      createSpy.mockRestore();
    });
  });

  describe('findOne', () => {
    it('should return a post', async () => {
      const execMock = {
        exec: jest.fn().mockResolvedValue(mockPost),
      };
      const findByIdSpy = jest.spyOn(postModel, 'findById').mockReturnValue(execMock as any);

      const result = await service.findOne('post-123');

      expect(result).toEqual(mockPost);
      expect(findByIdSpy).toHaveBeenCalledWith('post-123');

      findByIdSpy.mockRestore();
    });

    it('should throw NotFoundException if post does not exist', async () => {
      const execMock = {
        exec: jest.fn().mockResolvedValue(null),
      };
      const findByIdSpy = jest.spyOn(postModel, 'findById').mockReturnValue(execMock as any);

      await expect(service.findOne('post-123')).rejects.toThrow(
        new NotFoundException('Post not found'),
      );

      findByIdSpy.mockRestore();
    });
  });

  describe('findByUserId', () => {
    it('should return user posts sorted by date', async () => {
      const execMock = {
        exec: jest.fn().mockResolvedValue([mockPost]),
      };
      const sortMock = {
        sort: jest.fn().mockReturnValue(execMock),
      };
      const findSpy = jest.spyOn(postModel, 'find').mockReturnValue(sortMock as any);

      const result = await service.findByUserId('user-123');

      expect(result).toEqual([mockPost]);
      expect(findSpy).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(sortMock.sort).toHaveBeenCalledWith({ createdAt: -1 });

      findSpy.mockRestore();
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

      const findByIdSpy = jest.spyOn(postModel, 'findById').mockReturnValue(findExecMock as any);
      const deleteSpy = jest.spyOn(postModel, 'findByIdAndDelete').mockReturnValue(deleteExecMock as any);

      await service.deleteOne('post-123', 'user-123');

      expect(deleteSpy).toHaveBeenCalledWith('post-123');

      findByIdSpy.mockRestore();
      deleteSpy.mockRestore();
    });

    it('should throw ForbiddenException if not owner', async () => {
      const otherUserPost = {
        userId: 'other-user',
        _id: 'post-123',
        title: 'Test Post',
        description: 'Test Description',
        imageUrls: ['https://example.com/image.jpg'],
        location: 'Test Location',
        likesCount: 0,
      };

      const findExecMock = {
        exec: jest.fn().mockResolvedValue(otherUserPost),
      };

      const findByIdSpy = jest.spyOn(postModel, 'findById').mockReturnValue(findExecMock as any);

      await expect(
        service.deleteOne('post-123', 'user-123'),
      ).rejects.toThrow(new ForbiddenException('You can only delete your own posts'));

      findByIdSpy.mockRestore();
    });
  });

  describe('getPostsByUserIds', () => {
    it('should return posts from multiple users', async () => {
      const execMock = {
        exec: jest.fn().mockResolvedValue([mockPost]),
      };
      const sortMock = {
        sort: jest.fn().mockReturnValue(execMock),
      };
      const findSpy = jest.spyOn(postModel, 'find').mockReturnValue(sortMock as any);

      const result = await service.getPostsByUserIds(['user-1', 'user-2']);

      expect(result).toEqual([mockPost]);
      expect(findSpy).toHaveBeenCalledWith({
        userId: { $in: ['user-1', 'user-2'] },
      });

      findSpy.mockRestore();
    });
  });

  describe('incrementLikes', () => {
    it('should increment likes count', async () => {
      const updatedPost = { ...mockPost, likesCount: 1 };
      const postWithSave = {
        ...mockPost,
        save: jest.fn().mockResolvedValue(updatedPost),
      };
      const findExecMock = {
        exec: jest.fn().mockResolvedValue(postWithSave),
      };

      const findByIdSpy = jest.spyOn(postModel, 'findById').mockReturnValue(findExecMock as any);

      const result = await service.incrementLikes('post-123');

      expect(result.likesCount).toBe(1);

      findByIdSpy.mockRestore();
    });
  });
});
