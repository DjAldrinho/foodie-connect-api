export const configuration = () => {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  if (process.env.PORT && isNaN(port)) {
    throw new Error('PORT must be a number');
  }

  return {
    port: port || 3000,
    db: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      username: process.env.DB_USERNAME || 'foodie_user',
      password: process.env.DB_PASSWORD || 'foodie_pass',
      database: process.env.DB_DATABASE || 'foodie_db',
    },
    mongo: {
      uri:
        process.env.MONGO_URI ||
        'mongodb://localhost:27017/foodie_db?authSource=admin',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'default-secret',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT
        ? parseInt(process.env.REDIS_PORT, 10)
        : 6379,
    },
  };
};
