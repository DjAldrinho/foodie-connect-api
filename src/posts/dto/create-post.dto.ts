import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post title',
    example: 'Homemade Pizza',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Post description',
    example: 'Delicious homemade pizza with fresh ingredients',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of image URLs',
    example: ['https://example.com/pizza1.jpg', 'https://example.com/pizza2.jpg'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayNotEmpty()
  imageUrls?: string[];

  @ApiProperty({
    description: 'Restaurant or location name',
    example: 'Luigi\'s Restaurant',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;
}
