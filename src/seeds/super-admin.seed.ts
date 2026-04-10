import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { RoleName } from '../users/entities/role.entity';
import * as bcrypt from 'bcrypt';

export async function seedSuperAdmin(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);

  // Get environment variables
  const superAdminEmail = process.env.SUPERADMIN_EMAIL;
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD;
  const superAdminFullname = process.env.SUPERADMIN_FULLNAME;

  // Validate environment variables
  if (!superAdminEmail || !superAdminPassword || !superAdminFullname) {
    console.error('❌ Missing SUPER_ADMIN environment variables');
    console.error('Required: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_FULLNAME');
    throw new Error('SUPER_ADMIN environment variables not set');
  }

  // Check if super admin already exists
  const existingSuperAdmin = await userRepository.findOne({
    where: { email: superAdminEmail },
    relations: ['role'],
  });

  if (existingSuperAdmin) {
    console.log(`ℹ️  Super Admin already exists: ${superAdminEmail}`);

    // Update if role is not SUPER_ADMIN
    if (existingSuperAdmin.role?.name !== RoleName.SUPER_ADMIN) {
      const superAdminRole = await roleRepository.findOne({
        where: { name: RoleName.SUPER_ADMIN },
      });

      if (superAdminRole) {
        existingSuperAdmin.role = superAdminRole;
        await userRepository.save(existingSuperAdmin);
        console.log(`✅ Updated existing user to SUPER_ADMIN role: ${superAdminEmail}`);
      } else {
        console.error('❌ SUPER_ADMIN role not found in database');
      }
    }

    return;
  }

  // Get SUPER_ADMIN role
  const superAdminRole = await roleRepository.findOne({
    where: { name: RoleName.SUPER_ADMIN },
  });

  if (!superAdminRole) {
    console.error('❌ SUPER_ADMIN role not found in database. Run role seed first.');
    throw new Error('SUPER_ADMIN role not found');
  }

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(superAdminPassword, saltRounds);

  // Create super admin user
  const superAdmin = userRepository.create({
    email: superAdminEmail,
    password_hash: passwordHash,
    full_name: superAdminFullname,
    bio: 'Super Administrator - Full system access',
    role: superAdminRole,
  });

  await userRepository.save(superAdmin);

  console.log(`✅ Super Admin created successfully`);
  console.log(`   Email: ${superAdminEmail}`);
  console.log(`   Password: ${superAdminPassword}`);
  console.log(`   Role: SUPER_ADMIN`);
}
