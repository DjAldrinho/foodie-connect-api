import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RestaurantReview } from './entities/restaurant-review.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { User } from '../users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { getModelToken } from '@nestjs/mongoose';
import { DishReview, DishReviewSchema } from './schemas/dish-review.schema';
import { MongooseModule } from '@nestjs/mongoose';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let restaurantReviewRepository: Repository<RestaurantReview>;
  let dishReviewModel: any;
  let dataSource: DataSource;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
  } as User;

  const mockRestaurant: Restaurant = {
    id: 'restaurant-1',
    name: 'Test Restaurant',
    active: true,
  } as Restaurant;

  const mockRestaurantReview: RestaurantReview = {
    id: 'review-1',
    userId: 'user-1',
    restaurantId: 'restaurant-1',
    rating: 5,
    comment: 'Great food!',
    visitDate: new Date('2026-04-01'),
    photos: ['photo1.jpg'],
    verifiedVisit: false,
    helpfulCount: 3,
    createdAt: new Date('2026-04-08'),
    updatedAt: new Date('2026-04-08'),
    canEdit: () => true,
    addHelpfulVote: function() { this.helpfulCount++; },
    removeHelpfulVote: function() { if(this.helpfulCount > 0) this.helpfulCount--; },
  } as RestaurantReview;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot('mongodb://localhost:27017/test'),
        MongooseModule.forFeature([{ name: DishReview.name, schema: DishReviewSchema }]),
      ],
      providers: [
        ReviewsService,
        {
          provide: DataSource,
          useValue: {
            getRepository: jest.fn().mockReturnValue({
              findOne: jest.fn(),
              find: jest.fn(),
              create: jest.fn(),
              save: jest.fn(),
              remove: jest.fn(),
              createQueryBuilder: jest.fn(),
            }),
          },
        },
        {
          provide: getRepositoryToken(RestaurantReview),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Restaurant),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    dataSource = module.get<DataSource>(DataSource);
    restaurantReviewRepository = module.get(getRepositoryToken(RestaurantReview));
    dishReviewModel = module.get(getModelToken(DishReview.name));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRestaurantReview', () => {
    it('should create a restaurant review successfully', async () => {
      const createReviewDto = {
        restaurantId: 'restaurant-1',
        rating: 5,
        comment: 'Amazing food!',
        visitDate: '2026-04-01',
        photos: ['photo1.jpg'],
        verifiedVisit: false,
      };

      const restaurantRepository = {
        findOne: jest.fn().mockResolvedValue(mockRestaurant),
      };
      (dataSource.getRepository as jest.Mock) = jest.fn().mockReturnValue(restaurantRepository);

      const mockCreatedReview = { ...mockRestaurantReview, ...createReviewDto };
      (restaurantReviewRepository.create as jest.Mock) = jest.fn().mockReturnValue(mockCreatedReview);
      (restaurantReviewRepository.save as jest.Mock) = jest.fn().mockResolvedValue(mockCreatedReview);

      const result = await service.createRestaurantReview('user-1', createReviewDto);

      expect(result).toEqual(mockCreatedReview);
      expect(restaurantRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'restaurant-1', active: true },
      });
    });

    it('should throw NotFoundException if restaurant not found', async () => {
      const createReviewDto = {
        restaurantId: 'non-existent',
        rating: 5,
      };

      const restaurantRepository = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      (dataSource.getRepository as jest.Mock) = jest.fn().mockReturnValue(restaurantRepository);

      await expect(
        service.createRestaurantReview('user-1', createReviewDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already reviewed', async () => {
      const createReviewDto = {
        restaurantId: 'restaurant-1',
        rating: 5,
      };

      const restaurantRepository = {
        findOne: jest.fn().mockResolvedValue(mockRestaurant),
      };
      (dataSource.getRepository as jest.Mock) = jest.fn().mockReturnValue(restaurantRepository);
      (restaurantReviewRepository.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockRestaurantReview);

      await expect(
        service.createRestaurantReview('user-1', createReviewDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getRestaurantReviews', () => {
    it('should return paginated restaurant reviews', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockRestaurantReview], 1]),
      };

      (restaurantReviewRepository.createQueryBuilder as jest.Mock) = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.getRestaurantReviews({
        restaurantId: 'restaurant-1',
        page: 1,
        limit: 20,
      });

      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should sort by helpful when sortBy=helpful', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockRestaurantReview], 1]),
      };

      (restaurantReviewRepository.createQueryBuilder as jest.Mock) = jest.fn().mockReturnValue(mockQueryBuilder);

      await service.getRestaurantReviews({
        sortBy: 'helpful',
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('review.helpfulCount', 'DESC');
    });
  });

  describe('updateRestaurantReview', () => {
    it('should update review within 7 days', async () => {
      const updateReviewDto = { rating: 4, comment: 'Still good' };
      const mockUpdatedReview = { ...mockRestaurantReview, ...updateReviewDto };

      (restaurantReviewRepository.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockRestaurantReview);
      (restaurantReviewRepository.save as jest.Mock) = jest.fn().mockResolvedValue(mockUpdatedReview);

      const result = await service.updateRestaurantReview('review-1', 'user-1', updateReviewDto);

      expect(result).toEqual(mockUpdatedReview);
    });

    it('should throw BadRequestException if trying to edit after 7 days', async () => {
      const oldReview = {
        ...mockRestaurantReview,
        createdAt: new Date('2026-03-01'), // More than 7 days ago
        canEdit: () => false,
      };

      (restaurantReviewRepository.findOne as jest.Mock) = jest.fn().mockResolvedValue(oldReview);

      const updateReviewDto = { rating: 4 };

      await expect(
        service.updateRestaurantReview('review-1', 'user-1', updateReviewDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if not owner', async () => {
      (restaurantReviewRepository.findOne as jest.Mock) = jest.fn().mockResolvedValue(mockRestaurantReview);

      const updateReviewDto = { rating: 4 };

      await expect(
        service.updateRestaurantReview('review-1', 'different-user', updateReviewDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRestaurantRatingStats', () => {
    it('should return rating statistics', async () => {
      const mockReviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ];

      (restaurantReviewRepository.find as jest.Mock) = jest.fn().mockResolvedValue(mockReviews);

      const result = await service.getRestaurantRatingStats('restaurant-1');

      expect(result.averageRating).toBe(4.3);
      expect(result.totalReviews).toBe(4);
      expect(result.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 });
      expect(result.fiveStarPercentage).toBe(50);
    });

    it('should return zero stats if no reviews', async () => {
      (restaurantReviewRepository.find as jest.Mock) = jest.fn().mockResolvedValue([]);

      const result = await service.getRestaurantRatingStats('restaurant-1');

      expect(result.averageRating).toBe(0);
      expect(result.totalReviews).toBe(0);
    });
  });

  describe('Dish Reviews', () => {
    it('should create a dish review', async () => {
      const createReviewDto = {
        postId: 'post-1',
        rating: 5,
        liked: true,
        comment: 'Delicious!',
      };

      (dishReviewModel.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
      (dishReviewModel.prototype.save as jest.Mock) = jest.fn().mockResolvedValue(createReviewDto);

      const result = await service.createDishReview('user-1', createReviewDto);

      expect(result).toBeDefined();
    });

    it('should throw ConflictException if dish already reviewed', async () => {
      const createReviewDto = {
        postId: 'post-1',
        rating: 5,
      };

      (dishReviewModel.findOne as jest.Mock) = jest.fn().mockResolvedValue({ id: 'existing-review' });

      await expect(
        service.createDishReview('user-1', createReviewDto),
      ).rejects.toThrow(ConflictException);
    });
  });
});
