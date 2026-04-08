import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { PostsModule } from '../posts/posts.module';
import { CacheModule } from '../common/cache/cache.module';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';

@Module({
  imports: [FollowsModule, PostsModule, CacheModule],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
