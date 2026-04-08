import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ description: 'Original image URL' })
  originalUrl!: string;

  @ApiProperty({ description: 'Thumbnail URL (200x200)' })
  thumbnailUrl!: string;

  @ApiProperty({ description: 'Medium size URL (800x600)' })
  mediumUrl!: string;

  @ApiProperty({ description: 'Large size URL (1920x1080)' })
  largeUrl!: string;

  @ApiProperty({ description: 'Public ID of the image in Cloudinary' })
  publicId!: string;

  @ApiProperty({ description: 'Image format' })
  format!: string;

  @ApiProperty({ description: 'Original file size in bytes' })
  size!: number;

  @ApiProperty({ description: 'Image width' })
  width!: number;

  @ApiProperty({ description: 'Image height' })
  height!: number;
}
