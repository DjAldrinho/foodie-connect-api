import { DataSource } from 'typeorm';
import { Role } from '../users/entities/role.entity';
import { RoleName } from '../users/entities/role.entity';

export async function seedRoles(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);

  const roles = [
    { name: RoleName.USER },
    { name: RoleName.RESTAURANT },
    { name: RoleName.ADMIN },
    { name: RoleName.SUPER_ADMIN },
  ];

  for (const roleData of roles) {
    const existing = await roleRepository.findOne({
      where: { name: roleData.name },
    });

    if (!existing) {
      const role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`✅ Role ${roleData.name} created`);
    } else {
      console.log(`ℹ️  Role ${roleData.name} already exists`);
    }
  }
}
