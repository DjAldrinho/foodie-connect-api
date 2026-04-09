import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { RestaurantReview } from './entities/restaurant-review.entity';
import { DishReview } from './schemas/dish-review.schema';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: jest.Mocked<ReviewsService>;

  const mockRestaurantReview: RestaurantReview = {
    id: 'review-1',
    userId: 'user-1',
    restaurantId: 'restaurant-1',
    rating: 5,
    comment: 'Great food!',
    helpfulCount: 3,
  } as RestaurantReview;

  const mockDishReview: DishReview = {
    id: 'dish-review-1',
    userId: 'user-1',
    postId: 'post-1',
    rating: 5,
    liked: true,
    comment: 'Amazing dish!',
    helpfulCount: 2,
  } as DishReview;

  const mockRatingStats = {
    averageRating: 4.5,
    totalReviews: 100,
    ratingDistribution: { 1: 2, 2: 5, 3: 10, 4: 30, 5: 53 },
    fiveStarPercentage: 53,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: {
            createRestaurantReview: jest.fn().mockResolvedValue(mockRestaurantReview),
            getRestaurantReviews: jest.fn().mockResolvedValue({
              results: [mockRestaurantReview],
              total: 1,
              page: 1,
              limit: 20,
            }),
            getRestaurantReview: jest.fn().mockResolvedValue(mockRestaurantReview),
            getRestaurantRatingStats: jest.fn().mockResolvedValue(mockRatingStats),
            updateRestaurantReview: jest.fn().mockResolvedValue(mockRestaurantReview),
            deleteRestaurantReview: jest.fn().mockResolvedValue(undefined),
            markRestaurantReviewHelpful: jest.fn().mockResolvedValue(mockRestaurantReview),
            createDishReview: jest.fn().mockResolvedValue(mockDishReview),
            getDishReviews: jest.fn().mockResolvedValue({
              results: [mockDishReview],
              total: 1,
              page: 1,
              limit: 20,
            }),
            getDishReview: jest.fn().mockResolvedValue(mockDishReview),
            getDishRatingStats: jest.fn().mockResolvedValue(mockRatingStats),
            updateDishReview: jest.fn().mockResolvedValue(mockDishReview),
            deleteDishReview: jest.fn().mockResolvedValue(undefined),
            markDishReviewHelpful: jest.fn().mockResolvedValue(mockDishReview),
          },
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get(ReviewsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Restaurant Reviews
  describe('Restaurant Reviews', () => {
    it('should create a restaurant review', async () => {
      const createReviewDto = {
        restaurantId: 'restaurant-1',
        rating: 5,
        comment: 'Great food!',
      };

      const mockRequest = {
        user: { userId: 'user-1' },
      } as any;

      const result = await controller.createRestaurantReview(mockRequest, createReviewDto);

      expect(service.createRestaurantReview).toHaveBeenCalledWith('user-1', createReviewDto);
      expect(result).toEqual(mockRestaurantReview);
    });

    it('should get restaurant reviews', async () => {
      const query = {
        restaurantId: 'restaurant-1',
        page: 1,
        limit: 20,
      };

      const result = await controller.getRestaurantReviews(query);

      expect(service.getRestaurantReviews).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        results: [mockRestaurantReview],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should get restaurant review by ID', async () => {
      const result = await controller.getRestaurantReview('review-1');

      expect(service.getRestaurantReview).toHaveBeenCalledWith('review-1');
      expect(result).toEqual(mockRestaurantReview);
    });

    it('should get restaurant rating stats', async () => {
      const result = await controller.getRestaurantRatingStats('restaurant-1');

      expect(service.getRestaurantRatingStats).toHaveBeenCalledWith('restaurant-1');
      expect(result).toEqual(mockRatingStats);
    });

    it('should update restaurant review', async () => {
      const updateReviewDto = { rating: 4, comment: 'Still good!' };
      const mockRequest = {
        user: { userId: 'user-1' },
      } as any;

      const result = await controller.updateRestaurantReview('review-1', mockRequest, updateReviewDto);

      expect(service.updateRestaurantReview).toHaveBeenCalledWith('review-1', 'user-1', updateReviewDto);
      expect(result).toEqual(mockRestaurantReview);
    });

    it('should delete restaurant review', async () => {
      const mockRequest = {
        user: { userId: 'user-1' },
      } as any;

      await controller.deleteRestaurantReview('review-1', mockRequest);

      expect(service.deleteRestaurantReview).toHaveBeenCalledWith('review-1', 'user-1');
    });

    it('should mark restaurant review as helpful', async () => {
      const result = await controller.markRestaurantReviewHelpful('review-1');

      expect(service.markRestaurantReviewHelpful).toHaveBeenCalledWith('review-1');
      expect(result).toEqual(mockRestaurantReview);
    });
  });

  // Dish Reviews
  describe('Dish Reviews', () => {
    it('should create a dish review', async () => {
      const createReviewDto = {
        postId: 'post-1',
        rating: 5,
        liked: true,
        comment: 'Delicious!',
      };

      const mockRequest = {
        user: { userId: 'user-1' },
      } as any;

      const result = await controller.createDishReview(mockRequest, createReviewDto);

      expect(service.createDishReview).toHaveBeenCalledWith('user-1', createReviewDto);
      expect(result).toEqual(mockDishReview);
    });

    it('should get dish reviews', async () => {
      const query = {
        postId: 'post-1',
        page: 1,
        limit: 20,
      };

      const result = await controller.getDishReviews(query);

      expect(service.getDishReviews).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        results: [mockDishReview],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should get dish review by ID', async () => {
      const result = await controller.getDishReview('dish-review-1');

      expect(service.getDishReview).toHaveBeenCalledWith('dish-review-1');
      expect(result).toEqual(mockDishReview);
    });

    it('should get dish rating stats', async () => {
      const result = await controller.getDishRatingStats('dish-review-1');

      expect(service.getDishRatingStats).toHaveBeenCalledWith('dish-review-1');
      expect(result).toEqual(mockRatingStats);
    });

    it('should update dish review', async () => {
      const updateReviewDto = { rating: 5, comment: 'Even better!' };
      const mockRequest = {
        user: { userId: 'user-1' },
      } as any;

      const result = await controller.updateDishReview('dish-review-1', mockRequest, updateReviewDto);

      expect(service.updateDishReview).toHaveBeenCalledWith('dish-review-1', 'user-1', updateReviewDto);
      expect(result).toEqual(mockDishReview);
    });

    it('should delete dish review', async () => {
      const mockRequest = {
        user: { userId: 'user-1' },
      } as any;

      await controller.deleteDishReview('dish-review-1', mockRequest);

      expect(service.deleteDishReview).toHaveBeenCalledWith('dish-review-1', 'user-1');
    });

    it('should mark dish review as helpful', async () => {
      const result = await controller.markDishReviewHelpful('dish-review-1');

      expect(service.markDishReviewHelpful).toHaveBeenCalledWith('dish-review-1');
      expect(result).toEqual(mockDishReview);
    });
  });
});
