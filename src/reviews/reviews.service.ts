import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RestaurantReview } from './entities/restaurant-review.entity';
import { DishReview, DishReviewDocument } from './schemas/dish-review.schema';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { CreateRestaurantReviewDto, UpdateRestaurantReviewDto } from './dto/review.dto';
import { CreateDishReviewDto, UpdateDishReviewDto } from './dto/review.dto';
import { RestaurantReviewsQueryDto, DishReviewsQueryDto, RatingStatsDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  private restaurantReviewRepository: Repository<RestaurantReview>;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectModel(DishReview.name)
    private dishReviewModel: Model<DishReviewDocument>,
  ) {
    this.restaurantReviewRepository = dataSource.getRepository(RestaurantReview);
  }

  // ========== RESTAURANT REVIEWS ==========

  async createRestaurantReview(
    userId: string,
    createReviewDto: CreateRestaurantReviewDto,
  ): Promise<RestaurantReview> {
    // Check if restaurant exists
    const restaurantRepository = this.dataSource.getRepository(Restaurant);
    const restaurant = await restaurantRepository.findOne({
      where: { id: createReviewDto.restaurantId, active: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Check if user already reviewed this restaurant
    const existingReview = await this.restaurantReviewRepository.findOne({
      where: {
        userId,
        restaurantId: createReviewDto.restaurantId,
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'You have already reviewed this restaurant',
      );
    }

    const review = this.restaurantReviewRepository.create({
      userId,
      ...createReviewDto,
      visitDate: createReviewDto.visitDate
        ? new Date(createReviewDto.visitDate)
        : null,
    });

    return await this.restaurantReviewRepository.save(review);
  }

  async getRestaurantReviews(
    query: RestaurantReviewsQueryDto,
  ): Promise<{ results: RestaurantReview[]; total: number; page: number; limit: number }> {
    const {
      restaurantId,
      userId,
      minRating,
      page = 1,
      limit = 20,
      sortBy = 'recent',
    } = query;

    const queryBuilder = this.restaurantReviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.restaurant', 'restaurant')
      .where('review.isDeleted IS NULL');

    if (restaurantId) {
      queryBuilder.andWhere('review.restaurantId = :restaurantId', {
        restaurantId,
      });
    }

    if (userId) {
      queryBuilder.andWhere('review.userId = :userId', { userId });
    }

    if (minRating) {
      queryBuilder.andWhere('review.rating >= :minRating', { minRating });
    }

    // Sorting
    switch (sortBy) {
      case 'helpful':
        queryBuilder.orderBy('review.helpfulCount', 'DESC');
        break;
      case 'rating':
        queryBuilder.orderBy('review.rating', 'DESC');
        break;
      case 'recent':
      default:
        queryBuilder.orderBy('review.createdAt', 'DESC');
        break;
    }

    const [results, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { results, total, page, limit };
  }

  async getRestaurantReview(id: string): Promise<RestaurantReview> {
    const review = await this.restaurantReviewRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user', 'restaurant'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async updateRestaurantReview(
    id: string,
    userId: string,
    updateReviewDto: UpdateRestaurantReviewDto,
  ): Promise<RestaurantReview> {
    const review = await this.restaurantReviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('You can only edit your own reviews');
    }

    if (!review.canEdit()) {
      throw new BadRequestException(
        'Reviews can only be edited within 7 days of creation',
      );
    }

    Object.assign(review, updateReviewDto);
    return await this.restaurantReviewRepository.save(review);
  }

  async deleteRestaurantReview(id: string, userId: string): Promise<void> {
    const review = await this.restaurantReviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    review.isDeleted = true;
    await this.restaurantReviewRepository.save(review);
  }

  async markRestaurantReviewHelpful(id: string): Promise<RestaurantReview> {
    const review = await this.restaurantReviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.addHelpfulVote();
    return await this.restaurantReviewRepository.save(review);
  }

  async getRestaurantRatingStats(
    restaurantId: string,
  ): Promise<RatingStatsDto> {
    const reviews = await this.restaurantReviewRepository.find({
      where: { restaurantId },
      select: ['rating'],
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        fiveStarPercentage: 0,
      };
    }

    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      ratingDistribution[r.rating]++;
    });

    const fiveStarPercentage =
      (ratingDistribution[5] / totalReviews) * 100;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      fiveStarPercentage: Math.round(fiveStarPercentage),
    };
  }

  // ========== DISH REVIEWS ==========

  async createDishReview(
    userId: string,
    createReviewDto: CreateDishReviewDto,
  ): Promise<DishReview> {
    // Check if user already reviewed this dish
    const existingReview = await this.dishReviewModel.findOne({
      userId,
      postId: createReviewDto.postId,
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this dish');
    }

    const review = new this.dishReviewModel({
      userId,
      ...createReviewDto,
      editableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return await review.save();
  }

  async getDishReviews(
    query: DishReviewsQueryDto,
  ): Promise<{
    results: DishReview[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      postId,
      userId,
      minRating,
      page = 1,
      limit = 20,
      likedOnly,
    } = query;

    const filter: any = { isDeleted: false };

    if (postId) {
      filter.postId = postId;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (minRating) {
      filter.rating = { $gte: minRating };
    }

    if (likedOnly) {
      filter.liked = true;
    }

    const [results, total] = await Promise.all([
      this.dishReviewModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.dishReviewModel.countDocuments(filter),
    ]);

    return { results, total, page, limit };
  }

  async getDishReview(id: string): Promise<DishReview> {
    const review = await this.dishReviewModel.findById(id);

    if (!review || review.isDeleted) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async updateDishReview(
    id: string,
    userId: string,
    updateReviewDto: UpdateDishReviewDto,
  ): Promise<DishReview> {
    const review = await this.dishReviewModel.findById(id);

    if (!review || review.isDeleted) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('You can only edit your own reviews');
    }

    if (!review.canEdit()) {
      throw new BadRequestException(
        'Reviews can only be edited within 7 days of creation',
      );
    }

    Object.assign(review, updateReviewDto);
    return await review.save();
  }

  async deleteDishReview(id: string, userId: string): Promise<void> {
    const review = await this.dishReviewModel.findById(id);

    if (!review || review.isDeleted) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('You can only delete your own reviews');
    }

    review.isDeleted = true;
    await review.save();
  }

  async markDishReviewHelpful(id: string): Promise<DishReview> {
    const review = await this.dishReviewModel.findById(id);

    if (!review || review.isDeleted) {
      throw new NotFoundException('Review not found');
    }

    review.addHelpfulVote();
    return await review.save();
  }

  async getDishRatingStats(postId: string): Promise<RatingStatsDto> {
    const reviews = await this.dishReviewModel.find({
      postId,
      isDeleted: false,
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        fiveStarPercentage: 0,
      };
    }

    const totalReviews = reviews.length;
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      ratingDistribution[r.rating]++;
    });

    const fiveStarPercentage =
      (ratingDistribution[5] / totalReviews) * 100;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      fiveStarPercentage: Math.round(fiveStarPercentage),
    };
  }
}
