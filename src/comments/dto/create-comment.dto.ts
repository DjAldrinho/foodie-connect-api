import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: '¡Excelente plato! Muy recomendado' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Comment cannot exceed 1000 characters' })
  content!: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID if this is a reply',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  parentCommentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Editado: ¡Excelente plato!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;
}
