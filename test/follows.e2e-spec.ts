import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Follows E2E', () => {
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
      email: 'followstest@example.com',
      password: 'password123',
      full_name: 'Follow Test User',
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
        email: 'followstest@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /follow/:userId', () => {
    it('should follow a user', async () => {
      // Create another user to follow
      const targetUserDto = {
        email: 'target@example.com',
        password: 'password123',
        full_name: 'Target User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(targetUserDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`/follow/${targetUserDto.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should prevent self-follow', async () => {
      const response = await request(app.getHttpServer())
        .post(`/follow/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toBe('You cannot follow yourself');
    });

    it('should prevent duplicate follow', async () => {
      const targetUserDto = {
        email: 'target2@example.com',
        password: 'password123',
        full_name: 'Target User 2',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(targetUserDto)
        .expect(201);

      // First follow
      await request(app.getHttpServer())
        .post(`/follow/${targetUserDto.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Duplicate follow
      const response = await request(app.getHttpServer())
        .post(`/follow/${targetUserDto.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toBe('You already follow this user');
    });
  });

  describe('DELETE /follow/:userId', () => {
    it('should unfollow a user', async () => {
      const targetUserDto = {
        email: 'unfollow@example.com',
        password: 'password123',
        full_name: 'Unfollow User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(targetUserDto)
        .expect(201);

      // First follow
      await request(app.getHttpServer())
        .post(`/follow/${targetUserDto.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Then unfollow
      await request(app.getHttpServer())
        .delete(`/follow/${targetUserDto.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 404 if not following', async () => {
      const response = await request(app.getHttpServer())
        .delete('/follow/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toBe('Follow relationship not found');
    });
  });

  describe('GET /following', () => {
    it('should return list of followed users', async () => {
      // Follow multiple users
      for (let i = 1; i <= 3; i++) {
        const targetUserDto = {
          email: `following${i}@example.com`,
          password: 'password123',
          full_name: `Following User ${i}`,
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(targetUserDto)
          .expect(201);

        await request(app.getHttpServer())
          .post(`/follow/${targetUserDto.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/follow/following')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.ids).toBeInstanceOf(Array);
      expect(response.body.ids.length).toBe(3);
    });
  });

  describe('GET /followers', () => {
    it('should return list of followers', async () => {
      const response = await request(app.getHttpServer())
        .get('/follow/followers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.ids).toBeInstanceOf(Array);
    });
  });
});
