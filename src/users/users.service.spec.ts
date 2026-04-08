import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user by email', async () => {
    const user = { id: '1', email: 'test@example.com' };
    mockUserRepository.findOne.mockResolvedValue(user);

    const result = await service.findByEmail('test@example.com');
    expect(result).toEqual(user);
  });

  it('should find user by id', async () => {
    const user = { id: 'user-1', email: 'test@example.com' };
    mockUserRepository.findOne.mockResolvedValue(user);

    const result = await service.findById('user-1');
    expect(result).toEqual(user);
  });

  it('should create user with default USER role', async () => {
    const createUserDto = {
      email: 'new@example.com',
      password: 'hashed',
      full_name: 'New User',
    };

    const role = { id: 'role-1', name: 'USER' };
    const user = { id: 'user-1', ...createUserDto, role };

    mockRoleRepository.findOne.mockResolvedValue(role);
    mockUserRepository.create.mockReturnValue(user);
    mockUserRepository.save.mockResolvedValue(user);

    const result = await service.create(createUserDto);
    expect(result).toHaveProperty('role');
    expect(result.role).toEqual(role);
  });

  it('should update user profile', async () => {
    const updateUserDto = { bio: 'Updated bio' };
    const user = { id: 'user-1', email: 'test@example.com', ...updateUserDto };

    mockUserRepository.findOne.mockResolvedValue(user);
    mockUserRepository.save.mockResolvedValue(user);

    const result = await service.updateProfile('user-1', updateUserDto);
    expect(result.bio).toBe(updateUserDto.bio);
  });

  it('should soft delete user', async () => {
    mockUserRepository.softDelete.mockResolvedValue({ affected: 1 });

    await service.softDelete('user-1');
    expect(mockUserRepository.softDelete).toHaveBeenCalledWith('user-1');
  });

  it('should get public profile excluding password_hash', () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      full_name: 'Test User',
      password_hash: 'hashed_password',
      bio: 'Test bio',
    };

    const result = (service as any).getPublicProfile(user);

    expect(result).toHaveProperty('id', 'user-1');
    expect(result).toHaveProperty('email', 'test@example.com');
    expect(result).not.toHaveProperty('password_hash');
  });
});
