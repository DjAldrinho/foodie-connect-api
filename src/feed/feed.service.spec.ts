import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { FollowsService } from '../follows/follows.service';
import { PostsService } from '../posts/posts.service';
import { CacheService } from '../common/cache/cache.service';

describe('FeedService', () => {
  let service: FeedService;
  let followsService: FollowsService;
  let postsService: PostsService;
  let cacheService: CacheService;

  const mockFollows = {
    user1: ['user-2', 'user-3'],
    user2: ['user-1'],
  };

  const mockPosts = [
    { userId: 'user-2', title: 'Post 2', createdAt: '2024-01-15T10:00:00Z' },
    { userId: 'user-3', title: 'Post 3', createdAt: '2024-01-16T10:00:00Z' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: FollowsService,
          useValue: {
            getFollowingIds: jest.fn().mockResolvedValue({
              ids: mockFollows.user1,
              total: 2,
            }),
          },
        },
        {
          provide: PostsService,
          useValue: {
            getPostsByUserIds: jest.fn().mockResolvedValue(mockPosts),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delPattern: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    followsService = module.get<FollowsService>(FollowsService);
    postsService = module.get<PostsService>(PostsService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserFeed', () => {
    it('should return cached feed if available', async () => {
      cacheService.get = jest.fn().mockResolvedValue(
        JSON.stringify(mockPosts),
      );

      const result = await service.getUserFeed('user-1', { page: 1, limit: 10 });

      expect(result).toEqual(mockPosts);
      expect(cacheService.get).toHaveBeenCalledWith(
        'feed:user:user-1:page:1',
      );
      expect(postsService.getPostsByUserIds).not.toHaveBeenCalled();
    });

    it('should fetch fresh feed if not cached', async () => {
      cacheService.get = jest.fn().mockResolvedValue(null);
      cacheService.set = jest.fn().mockResolvedValue(undefined);

      const result = await service.getUserFeed('user-1', { page: 1, limit: 10 });

      expect(result).toEqual(mockPosts);
      expect(followsService.getFollowingIds).toHaveBeenCalledWith(
        'user-1',
        1,
        1000,
      );
      expect(postsService.getPostsByUserIds).toHaveBeenCalledWith(
        mockFollows.user1,
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        'feed:user:user-1:page:1',
        JSON.stringify(mockPosts),
        300,
      );
    });

    it('should filter by date range', async () => {
      cacheService.get = jest.fn().mockResolvedValue(null);
      const query = {
        page: 1,
        limit: 10,
        startDate: '2024-01-16',
        endDate: '2024-01-31',
      };

      const result = await service.getUserFeed('user-1', query);

      // Post 2 is from 2024-01-15, so should be filtered out
      expect(result).toEqual([mockPosts[1]]);
    });

    it('should paginate results', async () => {
      cacheService.get = jest.fn().mockResolvedValue(null);
      const query = { page: 1, limit: 1 };

      const result = await service.getUserFeed('user-1', query);

      expect(result).toEqual([mockPosts[0]]); // Only first post
    });
  });

  describe('invalidateUserFeed', () => {
    it('should delete all feed pages for user', async () => {
      cacheService.delPattern = jest.fn().mockResolvedValue(undefined);

      await service.invalidateUserFeed('user-1');

      expect(cacheService.delPattern).toHaveBeenCalledWith('feed:*:user-1:*');
    });
  });
});
