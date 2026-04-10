# 🌱 Database Seeders

## Overview

Los seeders inicializan datos base en la base de datos, incluyendo roles y usuarios administradores.

## Available Seeders

### 1. Role Seeder (`role.seed.ts`)
Crea los roles básicos del sistema:
- `USER` - Usuario regular
- `RESTAURANT` - Perfil de restaurante
- `ADMIN` - Administrador
- `SUPER_ADMIN` - Super administrador (acceso total)

### 2. Super Admin Seeder (`super-admin.seed.ts`)
Crea el usuario Super Administrador leyendo las variables de entorno del `.env`.

## Environment Variables

Agrega estas variables a tu archivo `.env`:

```env
# Super Admin Credentials
SUPERADMIN_EMAIL=admin@foodieconnect.com
SUPERADMIN_PASSWORD=YourSecurePassword123!
SUPERADMIN_FULLNAME=Super Admin
```

**⚠️ IMPORTANTE:**
- Usa una contraseña segura en producción
- El email debe ser único en el sistema
- El usuario se creará solo si no existe

## Usage

### Ejecutar todos los seeders:

```bash
npm run seed
```

### Ejecutar manualmente:

```bash
# Development
npm run start:dev seed

# Production
npm run seed
```

## What Happens When You Run Seed

1. **Role Seeder**:
   - Crea roles si no existen
   - Si existen, los salta (idempotent)

2. **Super Admin Seeder**:
   - Valida que existan las variables de entorno
   - Busca si el usuario ya existe por email
   - Si NO existe:
     * Crea el usuario con el rol SUPER_ADMIN
     * Hashea el password con bcrypt (10 salt rounds)
     * Muestra credenciales en consola
   - Si existe:
     * Verifica que tenga el rol SUPER_ADMIN
     * Si no lo tiene, actualiza el rol

## Expected Output

```bash
🌱 Database connected
✅ Role USER created
✅ Role RESTAURANT created
✅ Role ADMIN created
✅ Role SUPER_ADMIN created
✅ Super Admin created successfully
   Email: admin@foodieconnect.com
   Password: YourSecurePassword123!
   Role: SUPER_ADMIN
✅ Seeds completed successfully
```

## Troubleshooting

### Error: Missing SUPER_ADMIN environment variables

**Solución**: Agrega las variables al `.env`:
```env
SUPERADMIN_EMAIL=your@email.com
SUPERADMIN_PASSWORD=SecurePassword123!
SUPERADMIN_FULLNAME=Your Name
```

### Error: SUPER_ADMIN role not found

**Solución**: El seeder de roles debe ejecutarse primero. Esto es automático en `npm run seed`.

### Usuario ya existe pero sin rol SUPER_ADMIN

**Solución**: El seeder detectará esto y actualizará el rol automáticamente:
```
ℹ️  Super Admin already exists: admin@foodieconnect.com
✅ Updated existing user to SUPER_ADMIN role: admin@foodieconnect.com
```

## Security Notes

1. **Nunca commitear el .env** con credenciales reales
2. **Usar contraseñas fuertes** en producción (mínimo 12 caracteres, mayúsculas, minúsculas, números, símbolos)
3. **Cambiar el password** después del primer login en producción
4. **Usar variables de entorno** en todos los ambientes (dev, staging, prod)

## Development Workflow

1. **Primer setup** de la base de datos:
   ```bash
   # Correr migraciones
   npm run migration:run

   # Correr seeders
   npm run seed
   ```

2. **Reset de base de datos** (development):
   ```bash
   # Borrar y recrear DB
   npm run db:drop && npm run db:create

   # Correr migraciones
   npm run migration:run

   # Correr seeders
   npm run seed
   ```

3. **Agregar nuevo rol**:
   1. Agregar al enum en `src/users/entities/role.entity.ts`
   2. Agregar al array en `src/seeds/role.seed.ts`
   3. Correr `npm run seed`

## Production Deployment

```bash
# Set environment variables in your hosting platform
export SUPERADMIN_EMAIL="admin@yourdomain.com"
export SUPERADMIN_PASSWORD="YourSecurePassword123!"
export SUPERADMIN_FULLNAME="Super Admin"

# Run migrations and seeds
npm run migration:run
npm run seed
```

---

**Última actualización**: 2026-04-10
**Status**: Production-ready
