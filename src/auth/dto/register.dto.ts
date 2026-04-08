import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password (min 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  full_name!: string;
}
