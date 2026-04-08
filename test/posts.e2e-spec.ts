import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Posts E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);

    // Create test user
    const registerDto = {
      email: 'poststest@example.com',
      password: 'password123',
      full_name: 'Posts Test User',
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
        email: 'poststest@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const createPostDto = {
        title: 'Delicious Burger',
        description: 'Homemade burger with secret sauce',
        imageUrls: ['https://example.com/burger.jpg'],
        location: 'Burger Joint',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201);

      expect(response.body).toHaveProperty('title', 'Delicious Burger');
      expect(response.body).toHaveProperty('userId', testUser.id);
      expect(response.body).toHaveProperty('likesCount', 0);
    });

    it('should create post with only required fields', async () => {
      const createPostDto = {
        title: 'Simple Post',
      };

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201);

      expect(response.body).toHaveProperty('title', 'Simple Post');
      expect(response.body.imageUrls).toEqual([]);
      expect(response.body.likesCount).toBe(0);
    });
  });

  describe('GET /posts/:id', () => {
    it('should get a post by ID', async () => {
      // Create a post first
      const createPostDto = {
        title: 'Test Post',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPostDto)
        .expect(201);

      const postId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(response.body).toHaveProperty('title', 'Test Post');
    });

    it('should return 404 for non-existent post', async () => {
      await request(app.getHttpServer())
        .get('/posts/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /posts/me', () => {
    it('should get current user posts', async () => {
      // Create a post first
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'My Post' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/posts/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete own post', async () => {
      // Create a post first
      const createResponse = await request(app.getServer())
        .post('/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Post to Delete' })
        .expect(201);

      const postId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should not allow deleting other users posts', async () => {
      // Create another user
      const otherUserDto = {
        email: 'otheruser@example.com',
        password: 'password123',
        full_name: 'Other User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(otherUserDto)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'otheruser@example.com',
          password: 'password123',
        })
        .expect(200);

      const otherAuthToken = loginResponse.body.access_token;

      // Create post with other user
      const createResponse = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({ title: 'Other User Post' })
        .expect(201);

      const postId = createResponse.body.id;

      // Try to delete with first user
      await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });
});
