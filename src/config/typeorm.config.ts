import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { Follow } from '../follows/entities/follow.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantReview } from '../reviews/entities/restaurant-review.entity';
import { Secret } from '../auth/entities/secret.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'foodie_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'foodie_db',
  entities: [User, Role, Follow, Restaurant, RestaurantReview, Secret],
  migrations: ['src/migrations/*.ts'],
});
