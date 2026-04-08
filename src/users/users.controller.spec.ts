import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    updateProfile: jest.fn(),
    softDelete: jest.fn(),
    getPublicProfile: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: { name: 'USER' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        { provide: RolesGuard, useValue: { canActivate: jest.fn(() => true) } },
        Reflector,
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const req = { user: { userId: mockUser.id } };

      const publicProfile = {
        id: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.full_name,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.getPublicProfile.mockReturnValue(publicProfile);

      const result = await controller.getProfile(req);

      expect(result).toEqual(publicProfile);
      expect(service.findById).toHaveBeenCalledWith(mockUser.id);
      expect(service.getPublicProfile).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateUserDto = { bio: 'Updated bio' };
      const updatedUser = { ...mockUser, ...updateUserDto };

      const req = { user: { userId: mockUser.id } };
      mockUsersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(req, updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(service.updateProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
      );
    });
  });

  describe('deleteAccount', () => {
    it('should soft delete user account', async () => {
      const req = { user: { userId: mockUser.id } };
      mockUsersService.softDelete.mockResolvedValue(undefined);

      await controller.deleteAccount(req);

      expect(service.softDelete).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getUserById', () => {
    it('should return public user profile by id', async () => {
      const publicProfile = {
        id: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.full_name,
        bio: 'Test bio',
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.getPublicProfile.mockReturnValue(publicProfile);

      const result = await controller.getUserById(mockUser.id);

      expect(result).toEqual(publicProfile);
      expect(service.findById).toHaveBeenCalledWith(mockUser.id);
      expect(service.getPublicProfile).toHaveBeenCalledWith(mockUser);
    });
  });
});
