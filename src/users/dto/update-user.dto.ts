import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterDto } from '../../auth/dto/register.dto';

export class UpdateUserDto extends PartialType(RegisterDto) {
  @ApiProperty({
    description: 'User biography',
    example: 'Food lover and cooking enthusiast',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({
    description: 'Profile picture URL (must be a valid image URL)',
    example: 'https://example.com/profile.jpg',
    required: false,
    pattern: '^https?://.+/.*\\.(jpg|jpeg|png|gif|webp)$',
  })
  @IsString()
  @IsOptional()
  profile_picture_url?: string;
}
