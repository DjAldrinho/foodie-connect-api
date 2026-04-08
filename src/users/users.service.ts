import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { RoleName } from './entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async create(userData: Partial<User>) {
    const defaultRole = await this.roleRepository.findOne({
      where: { name: RoleName.USER },
    });

    if (!defaultRole) {
      throw new NotFoundException('Default USER role not found');
    }

    const user = this.userRepository.create({
      ...userData,
      role: defaultRole,
    });

    return this.userRepository.save(user);
  }

  async updateProfile(id: string, updateData: Partial<User>) {
    await this.findById(id);
    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }

  async softDelete(id: string) {
    await this.userRepository.softDelete(id);
  }

  getPublicProfile(user: User) {
    const { password_hash: _password_hash, ...publicProfile } = user;
    return publicProfile;
  }
}
