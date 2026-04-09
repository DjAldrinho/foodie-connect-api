import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { RestaurantReview } from './entities/restaurant-review.entity';
import { DishReview, DishReviewSchema } from './schemas/dish-review.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantReview]),
    MongooseModule.forFeature([{ name: DishReview.name, schema: DishReviewSchema }]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
