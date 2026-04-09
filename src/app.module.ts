import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { FollowsModule } from './follows/follows.module';
import { PostsModule } from './posts/posts.module';
import { FeedModule } from './feed/feed.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MediaModule } from './media/media.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenusModule } from './menus/menus.module';
import { SearchModule } from './search/search.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
          db: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT
              ? parseInt(process.env.DB_PORT, 10)
              : 5433,
            username: process.env.DB_USERNAME || 'foodie_user',
            password: process.env.DB_PASSWORD || 'foodie_pass',
            database: process.env.DB_DATABASE || 'foodie_db',
          },
          mongo: {
            uri:
              process.env.MONGO_URI ||
              'mongodb://localhost:27017/foodie_db?authSource=admin',
          },
          jwt: {
            secret:
              process.env.JWT_SECRET || 'default-secret-change-in-production',
          },
          redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT
              ? parseInt(process.env.REDIS_PORT, 10)
              : 6379,
          },
        }),
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5433,
      username: process.env.DB_USERNAME || 'foodie_user',
      password: process.env.DB_PASSWORD || 'foodie_pass',
      database: process.env.DB_DATABASE || 'foodie_db',
      entities: [__dirname + '/**/**/{users,follows,auth,restaurants,reviews}.entity{.ts,.js}'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        'mongodb://localhost:27017/foodie_db?authSource=admin',
    ),
    CommonModule,
    AuthModule,
    UsersModule,
    FollowsModule,
    PostsModule,
    FeedModule,
    CommentsModule,
    NotificationsModule,
    MediaModule,
    RestaurantsModule,
    MenusModule,
    SearchModule,
    ReviewsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
