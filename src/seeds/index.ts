import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { RestaurantReview } from '../reviews/entities/restaurant-review.entity';
import { Follow } from '../follows/entities/follow.entity';
import { seedRoles } from './role.seed';
import { seedSuperAdmin } from './super-admin.seed';

async function runSeeds() {
  // Create DataSource with explicit entities for seeders
  // Only PostgreSQL entities needed (MongoDB schemas don't need seeding)
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME || 'foodie_user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'foodie_db',
    entities: [Role, User, Restaurant, RestaurantReview, Follow],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('🌱 Database connected');

    await seedRoles(dataSource);
    await seedSuperAdmin(dataSource);

    console.log('✅ Seeds completed successfully');
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

void runSeeds();
