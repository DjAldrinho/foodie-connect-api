import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user and return 201', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', registerDto.email);
      expect(response.body).toHaveProperty('full_name', registerDto.full_name);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 409 when email already exists', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        full_name: 'Duplicate User',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Duplicate registration
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body).toHaveProperty('message', 'Email already exists');
    });

    it('should return 400 for invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'password123',
        full_name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '12345',
        full_name: 'Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    const existingUser = {
      email: 'login@example.com',
      password: 'password123',
      full_name: 'Login User',
    };

    beforeAll(async () => {
      // Register user first
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(existingUser)
        .expect(201);
    });

    it('should login and return JWT token', async () => {
      const loginDto = {
        email: existingUser.email,
        password: existingUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto = {
        email: existingUser.email,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 401 for non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });
});
