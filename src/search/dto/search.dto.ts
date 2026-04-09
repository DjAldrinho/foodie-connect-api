import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  Max,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search query',
    example: 'pasta italiana',
  })
  @IsOptional()
  @IsString()
  q?: string;

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
}

export class SearchRestaurantsDto extends SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Cuisine type filter',
    example: 'Italiana',
  })
  @IsOptional()
  @IsString()
  cuisineType?: string;

  @ApiPropertyOptional({ description: 'City filter', example: 'Montevideo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Price range (1-4)', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  priceRange?: number;

  @ApiPropertyOptional({ description: 'Verified only', example: true })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({
    description: 'Latitude for geo-distance',
    example: -34.9011,
  })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude for geo-distance',
    example: -56.1645,
  })
  @IsOptional()
  @IsNumber()
  lon?: number;

  @ApiPropertyOptional({ description: 'Distance in km', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  distance?: number;
}

export class SearchPostsDto extends SearchQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class SearchCommentsDto extends SearchQueryDto {
  @ApiPropertyOptional({ description: 'Filter by post ID' })
  @IsOptional()
  @IsString()
  postId?: string;
}

export class AutocompleteDto {
  @ApiProperty({ description: 'Search query', example: 'pas' })
  @IsString()
  @IsNotEmpty()
  q!: string;

  @ApiPropertyOptional({
    description: 'Search type',
    enum: ['restaurants', 'all'],
    example: 'all',
  })
  @IsOptional()
  @IsEnum(['restaurants', 'all'])
  type?: 'restaurants' | 'all' = 'all';

  @ApiPropertyOptional({ description: 'Max suggestions', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}
