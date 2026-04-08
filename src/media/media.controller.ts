import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UploadDto } from './dto/upload.dto';
import { UploadResponseDto } from './dto/upload-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('media')
@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload image with automatic optimization' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload',
    type: UploadDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.mediaService.uploadImage(file);
  }
}
