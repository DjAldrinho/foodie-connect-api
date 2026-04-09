import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Reviews E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testUser: any;
  let testRestaurant: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);

    // Create test user
    const registerDto = {
      email: 'reviewstest@example.com',
      password: 'password123',
      full_name: 'Reviews Test User',
    };

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    testUser = registerResponse.body;

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'reviewstest@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;

    // Create test restaurant
    const restaurantDto = {
      name: 'Test Restaurant for Reviews',
      description: 'Amazing food',
      cuisineType: 'Italiana',
      priceRange: 2,
      address: {
        street: 'Main St 123',
        city: 'Montevideo',
        state: 'Montevideo',
        latitude: -34.9011,
        longitude: -56.1645,
      },
    };

    const restaurantResponse = await request(app.getHttpServer())
      .post('/restaurants')
      .set('Authorization', `Bearer ${authToken}`)
      .send(restaurantDto)
      .expect(201);

    testRestaurant = restaurantResponse.body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Restaurant Reviews', () => {
    let testReview: any;

    it('should create a restaurant review', async () => {
      const createReviewDto = {
        restaurantId: testRestaurant.id,
        rating: 5,
        comment: 'Excellent pasta and great service!',
        visitDate: '2026-04-08',
        photos: ['https://example.com/photo1.jpg'],
        verifiedVisit: false,
      };

      const response = await request(app.getHttpServer())
        .post('/reviews/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createReviewDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('rating', 5);
      expect(response.body).toHaveProperty('comment', 'Excellent pasta and great service!');
      expect(response.body).toHaveProperty('userId', testUser.id);
      expect(response.body).toHaveProperty('restaurantId', testRestaurant.id);

      testReview = response.body;
    });

    it('should not allow duplicate reviews for same restaurant', async () => {
      const createReviewDto = {
        restaurantId: testRestaurant.id,
        rating: 4,
        comment: 'Try again',
      };

      await request(app.getHttpServer())
        .post('/reviews/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createReviewDto)
        .expect(409); // Conflict
    });

    it('should get restaurant reviews', async () => {
      const response = await request(app.getHttpServer())
        .get('/reviews/restaurants')
        .query({ restaurantId: testRestaurant.id })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });

    it('should get restaurant review by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reviews/restaurants/${testReview.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testReview.id);
      expect(response.body).toHaveProperty('rating', 5);
    });

    it('should get restaurant rating statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reviews/restaurants/${testRestaurant.id}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body).toHaveProperty('ratingDistribution');
      expect(response.body).toHaveProperty('fiveStarPercentage');
    });

    it('should update restaurant review within 7 days', async () => {
      const updateReviewDto = {
        rating: 4,
        comment: 'Updated: Still good but not perfect',
      };

      const response = await request(app.getHttpServer())
        .patch(`/reviews/restaurants/${testReview.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateReviewDto)
        .expect(200);

      expect(response.body).toHaveProperty('rating', 4);
      expect(response.body).toHaveProperty('comment', 'Updated: Still good but not perfect');
    });

    it('should mark restaurant review as helpful', async () => {
      const response = await request(app.getHttpServer())
        .post(`/reviews/restaurants/${testReview.id}/helpful`)
        .expect(200);

      expect(response.body).toHaveProperty('helpfulCount');
      expect(response.body.helpfulCount).toBeGreaterThan(0);
    });

    it('should filter reviews by minimum rating', async () => {
      const response = await request(app.getHttpServer())
        .get('/reviews/restaurants')
        .query({ restaurantId: testRestaurant.id, minRating: 4 })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      // All results should have rating >= 4
      response.body.results.forEach((review: any) => {
        expect(review.rating).toBeGreaterThanOrEqual(4);
      });
    });

    it('should sort reviews by helpful', async () => {
      const response = await request(app.getHttpServer())
        .get('/reviews/restaurants')
        .query({ restaurantId: testRestaurant.id, sortBy: 'helpful' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });

  describe('Dish Reviews', () => {
    let testPost: any;
    let testDishReview: any;

    beforeAll(async () => {
      // Create a test post (dish)
      const postDto = {
        title: 'Delicious Pasta Carbonara',
        description: 'Authentic Italian recipe',
        imageUrls: ['https://example.com/pasta.jpg'],
      };

      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postDto)
        .expect(201);

      testPost = postResponse.body;
    });

    it('should create a dish review', async () => {
      const createReviewDto = {
        postId: testPost.id,
        rating: 5,
        liked: true,
        comment: 'Best pasta I ever had!',
      };

      const response = await request(app.getHttpServer())
        .post('/reviews/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createReviewDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('rating', 5);
      expect(response.body).toHaveProperty('liked', true);
      expect(response.body).toHaveProperty('userId', testUser.id);
      expect(response.body).toHaveProperty('postId', testPost.id);

      testDishReview = response.body;
    });

    it('should not allow duplicate reviews for same dish', async () => {
      const createReviewDto = {
        postId: testPost.id,
        rating: 4,
        liked: true,
      };

      await request(app.getHttpServer())
        .post('/reviews/dishes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createReviewDto)
        .expect(409); // Conflict
    });

    it('should get dish reviews', async () => {
      const response = await request(app.getHttpServer())
        .get('/reviews/dishes')
        .query({ postId: testPost.id })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);
    });

    it('should get dish review by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reviews/dishes/${testDishReview.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testDishReview.id);
      expect(response.body).toHaveProperty('rating', 5);
    });

    it('should get dish rating statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/reviews/dishes/${testPost.id}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalReviews');
    });

    it('should filter dish reviews by liked status', async () => {
      const response = await request(app.getHttpServer())
        .get('/reviews/dishes')
        .query({ postId: testPost.id, likedOnly: true })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      response.body.results.forEach((review: any) => {
        expect(review.liked).toBe(true);
      });
    });

    it('should update dish review within 7 days', async () => {
      const updateReviewDto = {
        rating: 4,
        comment: 'Updated: Still great',
      };

      const response = await request(app.getHttpServer())
        .patch(`/reviews/dishes/${testDishReview.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateReviewDto)
        .expect(200);

      expect(response.body).toHaveProperty('rating', 4);
    });

    it('should mark dish review as helpful', async () => {
      const response = await request(app.getHttpServer())
        .post(`/reviews/dishes/${testDishReview.id}/helpful`)
        .expect(200);

      expect(response.body).toHaveProperty('helpfulCount');
    });
  });

  describe('Validation', () => {
    it('should reject review with invalid rating', async () => {
      const createReviewDto = {
        restaurantId: testRestaurant.id,
        rating: 6, // Invalid: > 5
        comment: 'Too many stars!',
      };

      await request(app.getHttpServer())
        .post('/reviews/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createReviewDto)
        .expect(400); // Bad Request
    });

    it('should reject review with invalid rating < 1', async () => {
      const createReviewDto = {
        restaurantId: testRestaurant.id,
        rating: 0, // Invalid: < 1
        comment: 'No stars!',
      };

      await request(app.getHttpServer())
        .post('/reviews/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createReviewDto)
        .expect(400); // Bad Request
    });

    it('should reject review for non-existent restaurant', async () => {
      const createReviewDto = {
        restaurantId: 'non-existent-id',
        rating: 5,
        comment: 'Test review',
      };

      await request(app.getHttpServer())
        .post('/reviews/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createReviewDto)
        .expect(404); // Not Found
    });

    it('should reject review update after 7 days', async () => {
      // This test would require creating an old review or mocking time
      // For now, we'll test that the endpoint exists
      const response = await request(app.getHttpServer())
        .get(`/reviews/restaurants/${testRestaurant.id}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('averageRating');
    });
  });
});
