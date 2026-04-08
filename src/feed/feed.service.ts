import { Injectable } from '@nestjs/common';
import { FollowsService } from '../follows/follows.service';
import { PostsService } from '../posts/posts.service';
import { CacheService } from '../common/cache/cache.service';
import { FeedQueryDto } from './dto/feed-query.dto';

@Injectable()
export class FeedService {
  constructor(
    private followsService: FollowsService,
    private postsService: PostsService,
    private cacheService: CacheService,
  ) {}

  async getUserFeed(userId: string, query: FeedQueryDto) {
    const { page = 1, limit = 10, startDate, endDate } = query;
    const cacheKey = `feed:user:${userId}:page:${page}`;

    // Try cache first
    const cached = await this.cacheService.get<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as any[];
    }

    // Get following IDs
    const { ids: followingIds } = await this.followsService.getFollowingIds(
      userId,
      1,
      1000, // Get all following for feed
    );

    // Get posts from followed users
    const posts = await this.postsService.getPostsByUserIds(followingIds);

    // Apply date filters if provided
    let filteredPosts = posts;
    if (startDate || endDate) {
      filteredPosts = posts.filter((post) => {
        const postDate = new Date(post.createdAt);
        if (startDate && postDate < new Date(startDate)) {
          return false;
        }
        if (endDate && postDate > new Date(endDate)) {
          return false;
        }
        return true;
      });
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, JSON.stringify(paginatedPosts), 300);

    return paginatedPosts;
  }

  async invalidateUserFeed(userId: string): Promise<void> {
    // Invalidate all feed pages for this user's followers
    const pattern = `feed:*:${userId}:*`;
    await this.cacheService.delPattern(pattern);
  }
}
