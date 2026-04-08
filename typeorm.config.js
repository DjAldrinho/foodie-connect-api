require('dotenv').config();
const { DataSource } = require('typeorm');

module.exports = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'foodie_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'foodie_db',
  entities: ['src/**/**/{users,follows,auth,restaurants}.entity{.ts,.js}'],
  migrations: ['src/migrations/*.ts'],
  cli: {
    migrationsDir: 'src/migrations',
  },
});
