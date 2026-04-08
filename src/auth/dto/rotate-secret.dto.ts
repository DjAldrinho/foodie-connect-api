import { IsString, MinLength } from 'class-validator';

export class RotateSecretDto {
  @IsString()
  @MinLength(32)
  newSecret!: string;
}
