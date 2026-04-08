import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  const testUser = {
    email: 'userstest@example.com',
    password: 'password123',
    full_name: 'Users Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login to get JWT token
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
    userId = loginResponse.body.userId || loginResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should return user profile without password_hash', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('full_name', testUser.full_name);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });

  describe('/users/me (PATCH)', () => {
    it('should update user profile', async () => {
      const updateDto = {
        bio: 'Updated bio',
        profile_picture_url: 'https://example.com/pic.jpg',
      };

      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('bio', updateDto.bio);
      expect(response.body).toHaveProperty(
        'profile_picture_url',
        updateDto.profile_picture_url,
      );
    });

    it('should validate @IsImageUrl decorator for profile_picture_url', async () => {
      const updateDto = {
        profile_picture_url: 'not-an-image-url',
      };

      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ bio: 'test' })
        .expect(401);
    });
  });

  describe('/users/me (DELETE)', () => {
    it('should delete user account', async () => {
      await request(app.getHttpServer())
        .delete('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).delete('/users/me').expect(401);
    });
  });

  describe('/users/:id (GET) - Admin only', () => {
    let adminToken: string;

    const adminUser = {
      email: 'admin@example.com',
      password: 'admin123',
      full_name: 'Admin User',
    };

    beforeAll(async () => {
      // Create admin user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminUser)
        .expect(201);

      // Login as admin
      const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUser.email,
          password: adminUser.password,
        })
        .expect(200);

      adminToken = adminLogin.body.access_token;
    });

    it('should allow admin to get any user profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 403 when regular user tries to access another profile', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
