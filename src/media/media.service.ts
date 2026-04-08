import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import sharp from 'sharp';
import { Readable } from 'stream';

@Injectable()
export class MediaService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: any): Promise<any> {
    // Validate file
    this.validateImageFile(file);

    try {
      // Get image metadata using Sharp
      const metadata = await sharp(file.buffer).metadata();

      // Upload original to Cloudinary
      const originalUpload = await this.uploadToCloudinary(
        file.buffer,
        'foodie-connect/original',
      );

      // Generate and upload thumbnails with Sharp + Cloudinary
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover', position: 'center' })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailUpload = await this.uploadToCloudinary(
        thumbnailBuffer,
        'foodie-connect/thumbnails',
      );

      // Generate and upload medium size
      const mediumBuffer = await sharp(file.buffer)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();

      const mediumUpload = await this.uploadToCloudinary(
        mediumBuffer,
        'foodie-connect/medium',
      );

      // Generate and upload large size
      const largeBuffer = await sharp(file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toBuffer();

      const largeUpload = await this.uploadToCloudinary(
        largeBuffer,
        'foodie-connect/large',
      );

      return {
        originalUrl: originalUpload.secure_url,
        thumbnailUrl: thumbnailUpload.secure_url,
        mediumUrl: mediumUpload.secure_url,
        largeUrl: largeUpload.secure_url,
        publicId: originalUpload.public_id,
        format: metadata.format || 'unknown',
        size: file.size,
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new BadRequestException(`Failed to delete image: ${error.message}`);
    }
  }

  private validateImageFile(file: any): void {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${maxFileSize / 1024 / 1024}MB`,
      );
    }
  }

  private async uploadToCloudinary(
    buffer: Buffer,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as UploadApiResponse);
          }
        },
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }
}
