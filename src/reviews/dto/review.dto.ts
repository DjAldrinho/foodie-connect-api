import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsDateString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Base DTO with common fields
export class BaseReviewDto {
  @ApiPropertyOptional({ description: 'Rating from 1 to 5 stars', example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating!: number;

  @ApiPropertyOptional({
    description: 'Review comment',
    example: 'Amazing food and great service!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({
    description: 'Photos of the experience',
    example: ['https://example.com/photo1.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

// Restaurant Review DTO
export class CreateRestaurantReviewDto extends BaseReviewDto {
  @ApiProperty({ description: 'Restaurant ID' })
  @IsNotEmpty()
  @IsString()
  restaurantId!: string;

  @ApiPropertyOptional({
    description: 'Date of visit',
    example: '2026-04-08',
  })
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @ApiPropertyOptional({
    description: 'Verified visit (check-in)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  verifiedVisit?: boolean;
}

export class UpdateRestaurantReviewDto {
  @ApiPropertyOptional({ description: 'Rating from 1 to 5 stars', example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Updated review comment',
    example: 'Still great food!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({
    description: 'Add photos',
    example: ['https://example.com/new-photo.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

// Dish Review DTO
export class CreateDishReviewDto extends BaseReviewDto {
  @ApiProperty({ description: 'Post ID (dish post)' })
  @IsNotEmpty()
  @IsString()
  postId!: string;

  @ApiPropertyOptional({
    description: 'Liked the dish?',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  liked?: boolean;
}

export class UpdateDishReviewDto {
  @ApiPropertyOptional({ description: 'Rating from 1 to 5 stars', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Updated comment',
    example: 'Even better than before!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({ description: 'Update liked status', example: false })
  @IsOptional()
  @IsBoolean()
  liked?: boolean;
}

// Query DTOs
export class RestaurantReviewsQueryDto {
  @ApiPropertyOptional({ description: 'Restaurant ID' })
  @IsOptional()
  @IsString()
  restaurantId?: string;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Minimum rating', example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by', example: 'recent' })
  @IsOptional()
  @IsString()
  sortBy?: 'recent' | 'helpful' | 'rating' = 'recent';
}

export class DishReviewsQueryDto {
  @ApiPropertyOptional({ description: 'Post ID (dish)' })
  @IsOptional()
  @IsString()
  postId?: string;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Minimum rating', example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Show only liked reviews' })
  @IsOptional()
  @IsBoolean()
  likedOnly?: boolean;
}

// Rating Aggregation DTO
export class RatingStatsDto {
  @ApiProperty({ description: 'Average rating', example: 4.5 })
  averageRating!: number;

  @ApiProperty({ description: 'Total number of reviews', example: 150 })
  totalReviews!: number;

  @ApiProperty({
    description: 'Rating distribution',
    example: { 1: 5, 2: 3, 3: 10, 4: 30, 5: 102 },
  })
  ratingDistribution!: Record<number, number>;

  @ApiProperty({ description: '5-star percentage', example: 68 })
  fiveStarPercentage!: number;
}
