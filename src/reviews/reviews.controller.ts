import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import {
  CreateRestaurantReviewDto,
  UpdateRestaurantReviewDto,
  CreateDishReviewDto,
  UpdateDishReviewDto,
  RestaurantReviewsQueryDto,
  DishReviewsQueryDto,
  RatingStatsDto,
} from './dto/review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/request.types';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ========== RESTAURANT REVIEWS ==========

  @Post('restaurants')
  @ApiOperation({ summary: 'Create a restaurant review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createRestaurantReview(
    @Request() req: AuthenticatedRequest,
    @Body() createReviewDto: CreateRestaurantReviewDto,
  ) {
    return this.reviewsService.createRestaurantReview(
      req.user.userId,
      createReviewDto,
    );
  }

  @Get('restaurants')
  @ApiOperation({ summary: 'Get restaurant reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getRestaurantReviews(@Query() query: RestaurantReviewsQueryDto) {
    return this.reviewsService.getRestaurantReviews(query);
  }

  @Get('restaurants/:id')
  @ApiOperation({ summary: 'Get restaurant review by ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  async getRestaurantReview(@Param('id') id: string) {
    return this.reviewsService.getRestaurantReview(id);
  }

  @Get('restaurants/:id/stats')
  @ApiOperation({ summary: 'Get rating statistics for a restaurant' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getRestaurantRatingStats(@Param('id') id: string): Promise<RatingStatsDto> {
    return this.reviewsService.getRestaurantRatingStats(id);
  }

  @Patch('restaurants/:id')
  @ApiOperation({ summary: 'Update a restaurant review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  async updateRestaurantReview(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateReviewDto: UpdateRestaurantReviewDto,
  ) {
    return this.reviewsService.updateRestaurantReview(
      id,
      req.user.userId,
      updateReviewDto,
    );
  }

  @Delete('restaurants/:id')
  @ApiOperation({ summary: 'Delete a restaurant review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async deleteRestaurantReview(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reviewsService.deleteRestaurantReview(id, req.user.userId);
  }

  @Post('restaurants/:id/helpful')
  @ApiOperation({ summary: 'Mark restaurant review as helpful' })
  @ApiResponse({ status: 200, description: 'Helpful vote recorded' })
  async markRestaurantReviewHelpful(@Param('id') id: string) {
    return this.reviewsService.markRestaurantReviewHelpful(id);
  }

  // ========== DISH REVIEWS ==========

  @Post('dishes')
  @ApiOperation({ summary: 'Create a dish review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createDishReview(
    @Request() req: AuthenticatedRequest,
    @Body() createReviewDto: CreateDishReviewDto,
  ) {
    return this.reviewsService.createDishReview(req.user.userId, createReviewDto);
  }

  @Get('dishes')
  @ApiOperation({ summary: 'Get dish reviews' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getDishReviews(@Query() query: DishReviewsQueryDto) {
    return this.reviewsService.getDishReviews(query);
  }

  @Get('dishes/:id')
  @ApiOperation({ summary: 'Get dish review by ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  async getDishReview(@Param('id') id: string) {
    return this.reviewsService.getDishReview(id);
  }

  @Get('dishes/:id/stats')
  @ApiOperation({ summary: 'Get rating statistics for a dish' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getDishRatingStats(@Param('id') id: string): Promise<RatingStatsDto> {
    return this.reviewsService.getDishRatingStats(id);
  }

  @Patch('dishes/:id')
  @ApiOperation({ summary: 'Update a dish review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  async updateDishReview(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateReviewDto: UpdateDishReviewDto,
  ) {
    return this.reviewsService.updateDishReview(
      id,
      req.user.userId,
      updateReviewDto,
    );
  }

  @Delete('dishes/:id')
  @ApiOperation({ summary: 'Delete a dish review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async deleteDishReview(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.reviewsService.deleteDishReview(id, req.user.userId);
  }

  @Post('dishes/:id/helpful')
  @ApiOperation({ summary: 'Mark dish review as helpful' })
  @ApiResponse({ status: 200, description: 'Helpful vote recorded' })
  async markDishReviewHelpful(@Param('id') id: string) {
    return this.reviewsService.markDishReviewHelpful(id);
  }
}
