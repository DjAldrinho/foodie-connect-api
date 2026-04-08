import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../schemas/notification.schema';

export class GetNotificationsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    example: NotificationType.LIKE,
  })
  @IsOptional()
  type?: NotificationType;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  unreadOnly?: boolean;
}
