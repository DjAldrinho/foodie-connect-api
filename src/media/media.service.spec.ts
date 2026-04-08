import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

// Mock cloudinary
jest.mock('cloudinary');
const mockedCloudinary = cloudinary as jest.Mocked<typeof cloudinary>;

// Mock sharp
jest.mock('sharp');
const mockedSharp = sharp as jest.Mocked<typeof sharp>;

describe('MediaService', () => {
  let service: MediaService;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 500, // 500KB
    destination: '/tmp',
    filename: 'test.jpg',
    path: '/tmp/test.jpg',
    buffer: Buffer.from('test-image-data'),
  };

  const mockMetadata = {
    format: 'jpeg',
    width: 1920,
    height: 1080,
    size: 1024 * 500,
  };

  const mockCloudinaryResponse = {
    public_id: 'foodie-connect/original/test123',
    secure_url: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
    width: 1920,
    height: 1080,
    format: 'jpg',
    bytes: 1024 * 500,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaService],
    }).compile();

    service = module.get<MediaService>(MediaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    beforeEach(() => {
      // Mock sharp constructor
      mockedSharp.mockReturnValue({
        metadata: jest.fn().mockResolvedValue(mockMetadata),
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('resized')),
      } as any);

      // Mock cloudinary uploader
      mockedCloudinary.uploader.upload_stream = jest
        .fn()
        .mockImplementation((options, callback) => {
          callback(null, mockCloudinaryResponse);
          return {} as any;
        }) as any;
    });

    it('should upload image successfully', async () => {
      const result = await service.uploadImage(mockFile);

      expect(result).toHaveProperty('originalUrl');
      expect(result).toHaveProperty('thumbnailUrl');
      expect(result).toHaveProperty('mediumUrl');
      expect(result).toHaveProperty('largeUrl');
      expect(result).toHaveProperty('publicId');
      expect(result.format).toBe('jpeg');
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(service.uploadImage(invalidFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(invalidFile)).rejects.toThrow(
        'Invalid file type',
      );
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = { ...mockFile, size: 11 * 1024 * 1024 }; // 11MB

      await expect(service.uploadImage(largeFile)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadImage(largeFile)).rejects.toThrow(
        'File too large',
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      mockedCloudinary.uploader.destroy = jest
        .fn()
        .mockResolvedValue({ result: 'ok' });

      await expect(service.deleteImage('public-id')).resolves.not.toThrow();
      expect(mockedCloudinary.uploader.destroy).toHaveBeenCalledWith(
        'public-id',
      );
    });

    it('should throw BadRequestException on delete failure', async () => {
      mockedCloudinary.uploader.destroy = jest
        .fn()
        .mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteImage('public-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteImage('public-id')).rejects.toThrow(
        'Failed to delete image',
      );
    });
  });
});
