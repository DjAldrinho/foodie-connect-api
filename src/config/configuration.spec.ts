import { configuration } from './configuration';
import * as Joi from 'joi';

describe('configuration()', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate required environment variables', () => {
    process.env.PORT = '3000';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5433';
    process.env.DB_USERNAME = 'user';
    process.env.DB_PASSWORD = 'pass';
    process.env.DB_DATABASE = 'db';
    process.env.MONGO_URI = 'mongodb://localhost:27017';
    process.env.JWT_SECRET = 'secret';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';

    const config = configuration();

    expect(config.port).toBe(3000);
    expect(config.db).toBeDefined();
    expect(config.db.host).toBe('localhost');
    expect(config.mongo).toBeDefined();
    expect(config.mongo.uri).toBe('mongodb://localhost:27017');
    expect(config.jwt).toBeDefined();
    expect(config.jwt.secret).toBe('secret');
    expect(config.redis).toBeDefined();
    expect(config.redis.host).toBe('localhost');
  });

  it('should throw error when PORT is not a number', () => {
    process.env.PORT = 'invalid';

    expect(() => configuration()).toThrow();
  });

  it('should have default values for optional variables', () => {
    process.env.DB_HOST = 'localhost';
    process.env.DB_USERNAME = 'user';
    process.env.DB_PASSWORD = 'pass';
    process.env.DB_DATABASE = 'db';
    process.env.MONGO_URI = 'mongodb://localhost:27017';
    process.env.JWT_SECRET = 'secret';
    process.env.REDIS_HOST = 'localhost';
    delete process.env.PORT;
    delete process.env.DB_PORT;
    delete process.env.REDIS_PORT;

    const config = configuration();

    expect(config.port).toBe(3000);
    expect(config.db.port).toBe(5432);
    expect(config.redis.port).toBe(6379);
  });
});
