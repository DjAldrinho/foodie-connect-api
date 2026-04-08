import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
  ) {}

  async follow(followerId: string, followingId: string): Promise<Follow> {
    // Prevenir self-follow
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Verificar si ya sigue al usuario
    const existing = await this.followRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
      relations: ['follower', 'following'],
    });

    if (existing) {
      throw new BadRequestException('You already follow this user');
    }

    // Crear relación de follow
    const follow = this.followRepository.create({
      follower: { id: followerId } as User,
      following: { id: followingId } as User,
    });

    return this.followRepository.save(follow);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const follow = await this.followRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.followRepository.remove(follow);
  }

  async getFollowingIds(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ ids: string[]; total: number }> {
    const skip = (page - 1) * limit;

    const [follows, count] = await this.followRepository.findAndCount({
      where: { follower: { id: userId } },
      relations: ['following'],
      skip,
      take: limit,
    });

    const ids = follows.map((f) => f.following.id);

    return { ids, total: count };
  }

  async getFollowersIds(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ ids: string[]; total: number }> {
    const skip = (page - 1) * limit;

    const [follows, count] = await this.followRepository.findAndCount({
      where: { following: { id: userId } },
      relations: ['follower'],
      skip,
      take: limit,
    });

    const ids = follows.map((f) => f.follower.id);

    return { ids, total: count };
  }
}
