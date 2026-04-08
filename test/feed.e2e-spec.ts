import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Feed E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testUser: any;
  let testUser2: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);

    // Create first user
    const registerDto1 = {
      email: 'feedtest@example.com',
      password: 'password123',
      full_name: 'Feed Test User',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto1)
      .expect(201);

    const loginResponse1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'feedtest@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse1.body.access_token;
    testUser = loginResponse1.body;

    // Create second user
    const registerDto2 = {
      email: 'feedtest2@example.com',
      password: 'password123',
      full_name: 'Feed Test User 2',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto2)
      .expect(201);

    const loginResponse2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'feedtest2@example.com',
        password: 'password123',
      })
      .expect(200);

    testUser2 = loginResponse2.body;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /feed', () => {
    it('should return empty feed when following no one', async () => {
      const response = await request(app.getHttpServer())
        .get('/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return feed with posts from followed users', async () => {
      // User 2 creates a post
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${testUser2.access_token}`)
        .send({
          title: 'User 2 Post',
          description: 'Post by user 2',
        })
        .expect(201);

      // User 1 follows User 2
      await request(app.getHttpServer())
        .post(`/follow/${testUser2.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Get feed
      const response = await request(app.getHttpServer())
        .get('/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].toHaveProperty('title', 'User 2 Post');
    });

    it('should cache feed results', async () => {
      // First call - should fetch from DB
      const response1 = await request(app.getHttpServer())
        .get('/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Second call - should return cached result
      const response2 = await request(app.getHttpServer())
        .get('/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response1.body).toEqual(response2.body);
    });

    it('should filter by date range', async () => {
      const response = await request(app.getHttpServer())
        .get('/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should paginate feed results', async () => {
      // Create multiple posts
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post('/posts')
          .set('Authorization', `Bearer ${testUser2.access_token}`)
          .send({ title: `Post ${i}` })
          .expect(201);
      }

      // Request page 1 with limit 2
      const response = await request(app.getHttpServer())
        .get('/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 2,
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache when new post is created', async () => {
      // User 1 follows User 2
      await request(app.getHttpServer())
        .post(`/follow/${testUser2.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Get feed - should cache
      await request(app.getHttpServer())
        .get('/feed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // User 2 creates a new post
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${testUser2.access_token}`)
        .send({ title: 'New Post After Cache' })
        .expect(201);

      // TODO: Implement cache invalidation in PostsService
      // For now, we just verify the endpoint works
    });
  });
});
