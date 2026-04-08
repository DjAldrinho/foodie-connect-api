import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant, PriceRange } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(
    userId: string,
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    // Check if user already has a restaurant
    const existingRestaurant = await this.restaurantRepository.findOne({
      where: { userId },
    });

    if (existingRestaurant) {
      throw new BadRequestException('User already has a restaurant profile');
    }

    const restaurant = this.restaurantRepository.create({
      ...createRestaurantDto,
      userId,
      hours: createRestaurantDto.openingHours,
      verified: false, // Requires admin verification
    });

    return this.restaurantRepository.save(restaurant);
  }

  async findAll(filters?: {
    cuisineType?: string;
    priceRange?: PriceRange;
    city?: string;
    verified?: boolean;
  }): Promise<Restaurant[]> {
    const queryBuilder = this.restaurantRepository
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.owner', 'owner');

    if (filters?.cuisineType) {
      queryBuilder.andWhere(':cuisineType = ANY(restaurant.cuisineType)', {
        cuisineType: filters.cuisineType,
      });
    }

    if (filters?.priceRange !== undefined) {
      queryBuilder.andWhere('restaurant.priceRange = :priceRange', {
        priceRange: filters.priceRange,
      });
    }

    if (filters?.city) {
      queryBuilder.andWhere("restaurant.address->>'city' = :city", {
        city: filters.city,
      });
    }

    if (filters?.verified !== undefined) {
      queryBuilder.andWhere('restaurant.verified = :verified', {
        verified: filters.verified,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async findByOwner(userId: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { userId },
      relations: ['owner'],
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async update(
    id: string,
    userId: string,
    updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    // Check ownership
    if (restaurant.userId !== userId) {
      throw new ForbiddenException('Not your restaurant');
    }

    // Don't allow updating verified status (admin only)
    const { verified, openingHours, ...rest } = updateRestaurantDto as any;

    Object.assign(restaurant, rest);

    if (openingHours) {
      restaurant.hours = openingHours;
    }

    return this.restaurantRepository.save(restaurant);
  }

  async verifyRestaurant(id: string): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    restaurant.verified = true;
    return this.restaurantRepository.save(restaurant);
  }

  async addPhoto(
    id: string,
    userId: string,
    photoUrl: string,
  ): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    // Check ownership
    if (restaurant.userId !== userId) {
      throw new ForbiddenException('Not your restaurant');
    }

    if (!restaurant.photos.includes(photoUrl)) {
      restaurant.photos.push(photoUrl);
    }

    return this.restaurantRepository.save(restaurant);
  }

  async removePhoto(
    id: string,
    userId: string,
    photoUrl: string,
  ): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    // Check ownership
    if (restaurant.userId !== userId) {
      throw new ForbiddenException('Not your restaurant');
    }

    restaurant.photos = restaurant.photos.filter((photo) => photo !== photoUrl);

    return this.restaurantRepository.save(restaurant);
  }

  async deactivate(id: string, userId: string): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    // Check ownership
    if (restaurant.userId !== userId) {
      throw new ForbiddenException('Not your restaurant');
    }

    restaurant.active = false;
    return this.restaurantRepository.save(restaurant);
  }

  async activate(id: string, userId: string): Promise<Restaurant> {
    const restaurant = await this.findOne(id);

    // Check ownership
    if (restaurant.userId !== userId) {
      throw new ForbiddenException('Not your restaurant');
    }

    restaurant.active = true;
    return this.restaurantRepository.save(restaurant);
  }
}
