import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { BadRequestException } from '@nestjs/common';

describe('MediaController', () => {
  let controller: MediaController;
  let service: MediaService;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 500,
    destination: '/tmp',
    filename: 'test.jpg',
    path: '/tmp/test.jpg',
    buffer: Buffer.from('test-image-data'),
  };

  const mockUploadResponse = {
    originalUrl: 'https://res.cloudinary.com/demo/image/upload/original.jpg',
    thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/thumbnail.jpg',
    mediumUrl: 'https://res.cloudinary.com/demo/image/upload/medium.jpg',
    largeUrl: 'https://res.cloudinary.com/demo/image/upload/large.jpg',
    publicId: 'foodie-connect/original/test123',
    format: 'jpeg',
    size: 1024 * 500,
    width: 1920,
    height: 1080,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: MediaService,
          useValue: {
            uploadImage: jest.fn().mockResolvedValue(mockUploadResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<MediaController>(MediaController);
    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const result = await controller.uploadImage(mockFile);

      expect(service.uploadImage).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockUploadResponse);
      expect(result.originalUrl).toBe(mockUploadResponse.originalUrl);
      expect(result.thumbnailUrl).toBe(mockUploadResponse.thumbnailUrl);
      expect(result.mediumUrl).toBe(mockUploadResponse.mediumUrl);
      expect(result.largeUrl).toBe(mockUploadResponse.largeUrl);
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(controller.uploadImage(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.uploadImage(null as any)).rejects.toThrow(
        'No file provided',
      );
    });
  });
});
