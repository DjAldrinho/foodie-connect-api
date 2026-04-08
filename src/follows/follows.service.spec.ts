import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowsService } from './follows.service';
import { Follow } from './entities/follow.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('FollowsService', () => {
  let service: FollowsService;
  let repository: any;

  const mockFollow = {
    id: 'follow-123',
    follower: { id: 'user-1' },
    following: { id: 'user-2' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsService,
        {
          provide: getRepositoryToken(Follow),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FollowsService>(FollowsService);
    repository = module.get<any>(getRepositoryToken(Follow));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('follow', () => {
    it('should create follow relationship', async () => {
      repository.findOne = jest.fn().mockResolvedValue(null);
      repository.create = jest.fn().mockReturnValue(mockFollow);
      repository.save = jest.fn().mockResolvedValue(mockFollow);

      const result = await service.follow('user-1', 'user-2');

      expect(result).toEqual(mockFollow);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should prevent self-follow', async () => {
      await expect(service.follow('user-1', 'user-1')).rejects.toThrow(
        new BadRequestException('You cannot follow yourself'),
      );
    });

    it('should prevent duplicate follow', async () => {
      repository.findOne = jest.fn().mockResolvedValue(mockFollow);

      await expect(service.follow('user-1', 'user-2')).rejects.toThrow(
        new BadRequestException('You already follow this user'),
      );
    });
  });

  describe('unfollow', () => {
    it('should remove follow relationship', async () => {
      repository.findOne = jest.fn().mockResolvedValue(mockFollow);
      repository.remove = jest.fn().mockResolvedValue(undefined);

      await service.unfollow('user-1', 'user-2');

      expect(repository.remove).toHaveBeenCalledWith(mockFollow);
    });

    it('should throw if follow does not exist', async () => {
      repository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.unfollow('user-1', 'user-2')).rejects.toThrow(
        new NotFoundException('Follow relationship not found'),
      );
    });
  });

  describe('getFollowingIds', () => {
    it('should return following IDs with pagination', async () => {
      const mockFollows = [
        { following: { id: 'user-2' } },
        { following: { id: 'user-3' } },
      ];
      const mockCount = 2;

      repository.findAndCount = jest
        .fn()
        .mockResolvedValue([mockFollows, mockCount]);

      const result = await service.getFollowingIds('user-1', 1, 10);

      expect(result).toEqual({
        ids: ['user-2', 'user-3'],
        total: 2,
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { follower: { id: 'user-1' } },
        relations: ['following'],
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getFollowersIds', () => {
    it('should return follower IDs with pagination', async () => {
      const mockFollows = [
        { follower: { id: 'user-4' } },
        { follower: { id: 'user-5' } },
      ];
      const mockCount = 2;

      repository.findAndCount = jest
        .fn()
        .mockResolvedValue([mockFollows, mockCount]);

      const result = await service.getFollowersIds('user-1', 1, 10);

      expect(result).toEqual({
        ids: ['user-4', 'user-5'],
        total: 2,
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { following: { id: 'user-1' } },
        relations: ['follower'],
        skip: 0,
        take: 10,
      });
    });
  });
});
