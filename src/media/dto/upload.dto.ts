import { ApiProperty } from '@nestjs/swagger';

export class UploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file to upload (jpg, jpeg, png, webp, max 10MB)',
  })
  file!: any;
}
