import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Client } from '@elastic/elasticsearch';

describe('Search E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let testUser: any;
  let elasticsearchClient: Client;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Initialize Elasticsearch client
    elasticsearchClient = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    });

    // Create test user
    const registerDto = {
      email: 'searchtest@example.com',
      password: 'password123',
      full_name: 'Search Test User',
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
        email: 'searchtest@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Cleanup: delete test documents from Elasticsearch
    try {
      await elasticsearchClient.deleteByQuery({
        index: 'foodie-connect-posts',
        body: {
          query: {
            match: { userId: testUser.id },
          },
        },
      });
    } catch (error) {
      // Ignore cleanup errors
    }

    await app.close();
  });

  describe('GET /search/health', () => {
    it('should check Elasticsearch connection', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(['ok', 'error']).toContain(response.body.status);
    });
  });

  describe('GET /search/restaurants', () => {
    it('should search restaurants with text query', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/restaurants')
        .query({ q: 'restaurant', page: 1, limit: 20 })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should search restaurants with cuisine type filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/restaurants')
        .query({ cuisineType: 'Italiana' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should search restaurants with city filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/restaurants')
        .query({ city: 'Montevideo' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should search restaurants with price range filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/restaurants')
        .query({ priceRange: 2 })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should search restaurants with verified filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/restaurants')
        .query({ verified: true })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should search restaurants with geo-location', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/restaurants')
        .query({
          lat: -34.9011,
          lon: -56.1645,
          distance: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should paginate results correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/restaurants')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
    });

    it('should handle empty search', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/restaurants')
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });
  });

  describe('GET /search/posts', () => {
    let testPost: any;

    beforeAll(async () => {
      // Create a test post
      const createPostDto = {
        title: 'Delicious Pasta Test',
        description: 'Homemade pasta with tomato sauce',
        location: 'Montevideo',
      };

      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201);

      testPost = postResponse.body;

      // Wait for Elasticsearch to index
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    it('should search posts with text query', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/posts')
        .query({ q: 'pasta' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should filter posts by user ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/posts')
        .query({ userId: testUser.id })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should paginate post results', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/posts')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
    });
  });

  describe('GET /search/comments', () => {
    let testPost: any;
    let testComment: any;

    beforeAll(async () => {
      // Create a test post
      const postResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post for Comments',
          description: 'Post for comment search testing',
        })
        .expect(201);

      testPost = postResponse.body;

      // Create a test comment
      const commentResponse = await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: testPost.id,
          content: 'Great test comment about food',
        })
        .expect(201);

      testComment = commentResponse.body;

      // Wait for Elasticsearch to index
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    it('should search comments with text query', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/comments')
        .query({ q: 'food' })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should filter comments by post ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/comments')
        .query({ postId: testPost.id })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should paginate comment results', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/comments')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
    });
  });

  describe('GET /search/autocomplete', () => {
    it('should get autocomplete suggestions for all types', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/autocomplete')
        .query({ q: 'ita', type: 'all', limit: 5 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get autocomplete suggestions for restaurants only', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/autocomplete')
        .query({ q: 'res', type: 'restaurants', limit: 5 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should limit suggestions', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/autocomplete')
        .query({ q: 'test', limit: 3 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(3);
    });

    it('should require query parameter', async () => {
      await request(app.getHttpServer())
        .get('/search/autocomplete')
        .expect(400);
    });
  });

  describe('GET /search/featured', () => {
    it('should get featured restaurants with default limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/featured')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get featured restaurants with custom limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/featured')
        .query({ limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });
  });

  describe('POST /search/index/restaurants (Admin)', () => {
    it('should bulk index restaurants (protected)', async () => {
      const response = await request(app.getHttpServer())
        .post('/search/index/restaurants')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });
  });
});
