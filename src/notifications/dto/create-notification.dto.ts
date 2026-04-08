import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @ApiProperty({ example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.LIKE })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ example: 'Someone liked your post' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'John Doe liked your pizza post' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    description: 'Additional data (postId, commentId, etc.)',
    example: { postId: 'post-123', userId: 'user-456' },
  })
  @IsOptional()
  data?: Record<string, any>;
}
