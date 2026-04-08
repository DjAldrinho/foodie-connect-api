import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional } from 'class-validator';
import { RegisterDto } from '../../auth/dto/register.dto';

export class UpdateUserDto extends PartialType(RegisterDto) {
  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  profile_picture_url?: string;
}
