import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsNumber,
  IsBoolean,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuDto {
  @ApiProperty({
    description: 'Menu categories',
    type: Array,
  })
  @IsArray()
  @ArrayMinSize(1)
  categories!: any[];
}
