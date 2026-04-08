import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsObject,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceRange } from '../entities/restaurant.entity';

export class CreateRestaurantDto {
  @ApiProperty({ description: 'Restaurant name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Restaurant description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Cuisine types',
    type: [String],
    example: ['Italiana', 'Parrilla'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  cuisineType!: string[];

  @ApiProperty({
    description: 'Price range',
    enum: PriceRange,
    example: PriceRange.MODERATE,
  })
  @IsEnum(PriceRange)
  priceRange!: PriceRange;

  @ApiProperty({
    description: 'Restaurant address',
    type: 'object',
    additionalProperties: false,
    example: {
      street: 'Av. Brasil 1234',
      city: 'Montevideo',
      state: 'Montevideo',
      zipCode: '11200',
      country: 'Uruguay',
      latitude: -34.9011,
      longitude: -56.1645,
    },
  })
  @IsObject()
  address!: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  @ApiProperty({
    description: 'Opening hours',
    type: 'array',
    example: [
      { dayOfWeek: 1, open: '11:00', close: '23:00', closed: false },
      { dayOfWeek: 2, open: '11:00', close: '23:00', closed: false },
    ],
  })
  @IsArray()
  openingHours!: {
    dayOfWeek: number;
    open: string;
    close: string;
    closed: boolean;
  }[];

  @ApiProperty({
    description: 'Amenities',
    type: [String],
    example: ['WiFi', 'Parking', 'Delivery', 'AC'],
  })
  @IsArray()
  @IsString({ each: true })
  amenities!: string[];

  @ApiPropertyOptional({ description: 'Maximum capacity', example: 100 })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ description: 'Phone number', example: '+59899123456' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsString()
  @IsOptional()
  website?: string;
}
