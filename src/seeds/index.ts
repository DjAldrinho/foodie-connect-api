import 'reflect-metadata';
import dataSource from '../config/typeorm.config';
import { seedRoles } from './role.seed';
import { seedSuperAdmin } from './super-admin.seed';

async function runSeeds() {
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
