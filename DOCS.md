# 🚀 Foodie Connect API - Guía Completa de NestJS

> **Objetivo**: Aprender NestJS a través de un proyecto real con arquitectura limpia, polyglot persistence y buenas prácticas.

---

## 📚 Índice

1. [Conceptos Fundamentales de NestJS](#1-conceptos-fundamentales-de-nestjs)
2. [Arquitectura del Proyecto](#2-arquitectura-del-proyecto)
3. [Módulo de Configuración](#3-módulo-de-configuración)
4. [Capa Common - Utilidades Compartidas](#4-capa-common---utilidades-compartidas)
5. [Módulo de Autenticación](#5-módulo-de-autenticación)
6. [Módulo de Usuarios](#6-módulo-de-usuarios)
7. [Persistencia Políglota](#7-persistencia-políglota)
8. **[Fase 3: Módulo de Follows](#8-fase-3-módulo-de-follows)** ⭐ NUEVO
9. **[Fase 3: Módulo de Posts](#9-fase-3-módulo-de-posts)** ⭐ NUEVO
10. **[Fase 3: Módulo de Feed](#10-fase-3-módulo-de-feed)** ⭐ NUEVO
11. [Testing](#11-testing)
12. [Endpoints y su Propósito](#12-endpoints-y-su-propósito)
13. [Buenas Prácticas Aplicadas](#13-buenas-prácticas-aplicadas)

---

## 1. Conceptos Fundamentales de NestJS

### 🎯 ¿Qué es NestJS?

NestJS es un framework para construir **aplicaciones del lado del servidor** eficientes y escalables con **Node.js**. Se basa en **TypeScript** y combina elementos de **Programación Orientada a Objetos (OOP)**, **Programación Funcional (FP)** y **Programación Reactiva Funcional (FRP)**.

### 🔑 Conceptos Clave

#### Modules (`@Module`)
Los módulos son la **pieza fundamental de organización** en NestJS. Cada aplicación tiene al menos un módulo (el módulo raíz), pero la buena práctica es dividir la aplicación en **módulos de características**.

```typescript
@Module({
  imports: [OtherModule],      // Módulos que este módulo necesita
  controllers: [Controller],   // Controladores que manejan requests
  providers: [Service],         // Servicios inyectables (dependencias)
  exports: [Service],          // Qué se exporta para otros módulos
})
export class FeatureModule {}
```

**Por qué modularizar?**
- **Separación de preocupaciones**: Cada módulo tiene una responsabilidad clara
- **Reutilización**: Puedes exportar solo lo necesario
- **Lazy loading**: Cargar módulos solo cuando se necesitan (rendimiento)
- **Mantenibilidad**: Easier to navigate and maintain

#### Controllers (`@Controller`)

Los **controladores** manejan las **peticiones HTTP** y delegan la lógica de negocio a los **servicios**.

```typescript
@Controller('users')  // Prefijo de ruta: /users
export class UsersController {
  @Get('me')  // GET /users/me
  @Post()     // POST /users
  @Patch(':id') // PATCH /users/:id
  async methodName() {}
}
```

**Responsabilidades del Controller**:
- ✅ Recibir requests
- ✅ Validar datos (con DTOs)
- ✅ Retornar respuestas HTTP
- ❌ NO contener lógica de negocio
- ❌ NO acceder directamente a la base de datos

#### Services (`@Injectable`)

Los **servicios** contienen la **lógica de negocio**. Son **inyectables** y pueden ser usados por cualquier clase que los importe.

```typescript
@Injectable()  // Marca la clase como inyectable
export class UsersService {
  constructor(private userRepository: Repository<User>) {}
  
  async findAll() {
    return this.userRepository.find();
  }
}
```

**Por qué usar Services?**
- **Single Responsibility**: Un servicio = una responsabilidad
- **Inyección de Dependencias**: NestJS los instancia automáticamente
- **Testabilidad**: Fácil hacer mock para testing
- **Reutilización**: Pueden ser usados por múltiples controladores

#### Dependency Injection (DI)

NestJS usa **Inyección de Dependencias** extensamente. Esto significa que **no instancias clases manualmente**, NestJS lo hace por vos.

```typescript
// ❌ MAL - Instanciación manual
class UsersController {
  private service = new UsersService();  // Don't do this!
}

// ✅ BIEN - Inyección de dependencias
class UsersController {
  constructor(private usersService: UsersService) {}
}
```

**Ventajas de DI**:
- **Desacoplamiento**: Las clases no saben cómo se crean sus dependencias
- **Testing**: Podés inyectar mocks fácilmente
- **Flexibilidad**: Cambiá implementaciones sin tocar el código que lo usa

---

## 2. Arquitectura del Proyecto

### 📁 Estructura de Directorios

```
src/
├── auth/                    # Módulo de autenticación
│   ├── dto/                # Data Transfer Objects
│   ├── entities/           # Entidades TypeORM
│   ├── strategies/         # Estrategias Passport
│   ├── auth.controller.ts  # Controlador HTTP
│   ├── auth.service.ts     # Lógica de negocio
│   └── auth.module.ts      # Configuración del módulo
├── users/                  # Módulo de usuarios
│   ├── dto/
│   ├── entities/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── common/                 # Módulo global (@Global())
│   ├── cache/             # Servicio de caché Redis
│   ├── decorators/        # Decoradores personalizados
│   ├── guards/            # Protectores de rutas
│   ├── pipes/             # Transformadores de datos
│   └── types/             # Tipos TypeScript compartidos
├── config/                # Configuración global
├── migrations/            # Migraciones TypeORM
├── seeds/                 # Datos iniciales
├── main.ts                # Punto de entrada
└── app.module.ts          # Módulo raíz
```

### 🏗️ Patrón Capas

```
┌─────────────────────────────────────┐
│         CLIENT (HTTP Request)       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      CONTROLLER (Presentación)      │
│  - Valida request                   │
│  - Llama a Service                  │
│  - Retorna response                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       SERVICE (Negocio)             │
│  - Lógica de negocio                │
│  - Usa Repository/Provider          │
│  - Retorna entidades                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    REPOSITORY (Acceso a Datos)      │
│  - TypeORM/Mongoose                 │
│  - CRUD a base de datos             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      DATABASE (Postgres/Mongo)      │
└─────────────────────────────────────┘
```

**Por qué este patrón?**
- **Separación de responsabilidades**: Cada capa tiene una función clara
- **Testabilidad**: Podés testear cada capa independientemente
- **Mantenibilidad**: Cambiá la DB sin tocar el controller
- **Escalabilidad**: Agregá caché en el service sin cambiar el controller

---

## 3. Módulo de Configuración

### 🎯 Propósito

Centralizar y validar **todas las variables de entorno**. Esto evita errores de configuración en producción.

### 📁 Archivos

```typescript
// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5433,
    // ...
  },
});
```

### 🔍 ¿Por qué usar configuración centralizada?

**Problema sin ella**:
```typescript
// ❌ En cualquier archivo del proyecto
const dbHost = process.env.DB_HOST;  // Puede ser undefined!
const port = process.env.PORT;      // Puede ser "abc" (no número)!
```

**Solución con configuración**:
```typescript
// ✅ Configuración validada y tipada
const config = app.get(ConfigService);
const dbHost = config.db.host;  // Siempre string, validado
const port = config.port;        // Siempre number, con default
```

### 🛡️ Validación con Joi

```typescript
Joi.object({
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().default('localhost'),
  DB_PASSWORD: Joi.string().required(),  // Obligatorio
});
```

**Ventajas**:
- ✅ **Validación en startup**: La app no inicia si falta una variable
- ✅ **Type-safe**: Todo está tipado, no más `process.env.VAR`
- ✅ **Defaults**: Valores por defecto documentados
- ✅ **Documentación**: Todo en un solo lugar

---

## 4. Capa Common - Utilidades Compartidas

### 🌟 ¿Por qué @Global()?

```typescript
@Global()  // ✅ Disponible para todos los módulos sin importar
@Module({
  providers: [RolesGuard, JwtAuthGuard],
  exports: [RolesGuard, JwtAuthGuard],
})
export class CommonModule {}
```

**Sin @Global()**:
```typescript
// ❌ En cada módulo que necesite guards
@Module({
  imports: [CommonModule],  // Tenés que importarlo SIEMPRE
})
export class AuthModule {}
```

**Con @Global()**:
```typescript
// ✅ Solo declaralo una vez en AppModule
@Module({
  imports: [CommonModule],
})
export class AppModule {}
```

### 🛡️ Guards - Protectores de Rutas

Los **Guards** determinan si una **request puede proceder** o no.

#### JwtAuthGuard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      'isPublic',
      [context.getHandler(), context.getClass()],
    );
    
    if (isPublic) {
      return true;  // Ruta pública, no requiere JWT
    }
    
    return super.canActivate(context);  // Verificar JWT
  }
}
```

**¿Por qué verificar `isPublic`?**
- Algunas rutas deben ser públicas (`/auth/register`, `/auth/login`)
- El decorador `@Public()` marca estas rutas
- El Guard lee este metadata y permite el acceso sin JWT

#### RolesGuard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    
    if (!requiredRoles) {
      return true;  // Si no hay roles requeridos, permitir
    }
    
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    
    // Jerarquía: ADMIN puede acceder a todo
    if (user.role === 'ADMIN') {
      return true;
    }
    
    return requiredRoles.includes(user.role);
  }
}
```

**¿Por qué jerarquía de roles?**
- **ADMIN > USER/RESTAURANT**: Admin puede hacer todo
- **Flexibilidad**: Agregá nuevos roles fácilmente
- **Security by default**: Si no hay roles, se deniega (o permite, según tu lógica)

### 🎨 Decoradores Personalizados

#### @Roles()

```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Uso:
@Post('rotate-secret')
@Roles('ADMIN')  // Solo admin puede acceder
rotateSecret() {}
```

**¿Por qué decoradores?**
- **Declarativo**: El código dice qué hace, no cómo lo hace
- **Reutilizable**: Usalo en cualquier controller
- **Type-safe**: TypeScript valida los roles

#### @IsImageUrl()

```typescript
export const IMAGE_URL_REGEX = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;

export function IsImageUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isImageUrl',
      target: object.constructor,
      propertyName: propertyName,
      validator: {
        validate(value: any) {
          if (!value) return true;  // Opcional
          if (Array.isArray(value)) {
            return value.every((url) => IMAGE_URL_REGEX.test(url));
          }
          return IMAGE_URL_REGEX.test(value);
        },
      },
    });
  };
}
```

**¿Por qué validador custom?**
- `class-validator` no tiene validador de URL de imagen
- Regex específico para tu caso de uso
- Reutilizable en cualquier DTO

---

## 5. Módulo de Autenticación

### 🔐 ¿Por qué JWT (JSON Web Tokens)?

**Problema con sesiones tradicionales**:
```typescript
// ❌ Sesión en memoria
app.get('/profile', (req, res) => {
  const userId = req.session.userId;  // Si reinicias el server, pierdes sesiones
});
```

**Solución con JWT**:
```typescript
// ✅ Token autocontenido
app.get('/profile', (req, res) => {
  const userId = req.user.userId;  // El token contiene toda la info necesaria
});
```

**Ventajas de JWT**:
- ✅ **Stateless**: El servidor no guarda estado
- ✅ **Escalable**: Podés tener múltiples servidores
- ✅ **Cross-domain**: Funciona para APIs móviles, web, etc.
- ✅ **Autocontenido**: El token tiene toda la info necesaria

### 🔄 JWT Secret Rotation

**¿Por qué `/auth/rotate-secret`?**

**Escenario real**:
```
Día 1: Generás JWT con secret "abc123"
Día 10: Te das cuenta que "abc123" se comprometió (hackeo)
Día 11: Cambias el secret a "xyz789"
Problema: Todos los tokens generados con "abc123" siguen siendo válidos
```

**Solución - Rotación de Secret**:
```typescript
// jwt_secrets table
id | secret      | version | active | expires_at
---|-------------|---------|--------|------------
1  | abc123      | 1       | false  | 2024-01-15  ← Desactivado
2  | xyz789      | 2       | true   | 2024-12-31  ← Activo
```

**Por qué multi-secret?**
- ✅ **Transición suave**: Tokens antiguos siguen funcionando por un tiempo
- ✅ **Security**: Podés rotar secrets sin downtime
- ✅ **Auditoría: Sabés qué secret estaba activo en cada momento

**Cómo funciona**:
```typescript
// JwtStrategy valida TODOS los secrets activos
const secrets = await secretRepository.find({ where: { active: true } });
const activeSecrets = secrets.map((s) => s.secret);

// Passport-JS prueba con cada secret hasta encontrar uno que funcione
```

### 🔒 Bcrypt - Por qué no plain text?

```typescript
// ❌ MAL - Password en texto plano
user.password_hash = plainPassword;  // Si la DB es hackeada, todos los passwords expuestos

// ✅ BIEN - Hash con bcrypt
const hashedPassword = await bcrypt.hash(plainPassword, 10);
user.password_hash = hashedPassword;  // Irreversible
```

**¿Por qué bcrypt?**
- **One-way**: No podés "des-hashear" el password
- **Slow**: Tomar 10ms hace que bruteforce sea impráctico
- **Salt**: Cada password tiene un salt único (rainbow tables inútiles)

**¿Por qué 10 rounds?**
- **Tiempo de hash**: ~100ms en CPUs modernas
- **Security**: Más rounds = más tiempo, pero también más load en el server
- **Balance**: 10 es el sweet spot recomendado por OWASP

---

## 6. Módulo de Usuarios

### 🎯 Soft Delete - ¿Por qué no borrar definitivamente?

```typescript
// ❌ DELETE definitivo
await this.userRepository.delete(id);  // Perdiste los datos para siempre

// ✅ Soft Delete
await this.userRepository.softDelete(id);  // Marca como eliminado
```

**Ventajas del Soft Delete**:
- ✅ **Auditoría: Sabés quién tenía una cuenta
- ✅ **Restauración**: Podés recuperar cuentas borradas por error
- ✅ **Integridad referencial**: Posts de usuarios eliminados se mantienen
- ✅ **Legal**: GDPR "right to be forgotten" vs "retención de datos"

**¿Cómo funciona?**
```sql
-- deleted_at es NULL para usuarios activos
SELECT * FROM users WHERE deleted_at IS NULL;

-- deleted_at tiene timestamp para usuarios "eliminados"
SELECT * FROM users WHERE deleted_at IS NOT NULL;
```

### 🔒 Public Profile - ¿Por qué excluir password?

```typescript
getPublicProfile(user: User) {
  const { password_hash: _password_hash, ...publicProfile } = user;
  return publicProfile;  // No incluye password_hash
}
```

**Problema si retornas todo**:
```typescript
// ❌ Mal
{
  "id": "user-123",
  "email": "user@example.com",
  "password_hash": "$2b$10$abc...",  // ❌ Exposición de credenciales
  "full_name": "John Doe"
}
```

**Solución con exclusión**:
```typescript
// ✅ Bien
{
  "id": "user-123",
  "email": "user@example.com",
  "full_name": "John Doe"
  // password_hash no está presente
}
```

**Principio de最小 privilegio**:
- Solo exponemos lo necesario para el cliente
- El password_hash NUNCA debería salir de la API
- Inclusive en logs, evitá logear passwords

### 🏷️ Role-Based Access Control (RBAC)

**¿Por qué RBAC en lugar de permisos individuales?**

**Sin RBAC**:
```typescript
// ❌ Cada usuario tiene permisos específicos
user.permissions = ['create_post', 'delete_post', 'ban_user', 'rotate_secret'];
// Problema: Tenés que check cada permiso individualmente
```

**Con RBAC**:
```typescript
// ✅ Usuarios tienen roles con permisos predefinidos
user.role = Role.ADMIN;  // Hereda todos los permisos de admin

// En el guard:
if (user.role === 'ADMIN') {
  return true;  // Admin puede hacer todo
}
```

**Ventajas**:
- ✅ **Manejabilidad**: Cambiá permisos en un solo lugar
- ✅ **Escalabilidad**: Agregá nuevos roles fácilmente
- ✅ **Security**: Menor superficie de error

**Jerarquía de roles implementada**:
```
ADMIN > USER/RESTAURANT
```
- Admin puede hacer TODO
- User solo puede operar sobre su propio perfil
- Restaurant tendrá permisos especiales (en Phase 3)

---

## 7. Persistencia Políglota

### 🎯 ¿Por qué DOS bases de datos?

**PostgreSQL (Relacional)**:
- ✅ Datos estructurados con relaciones fuertes
- ✅ ACID (transacciones atómicas)
- ✅ Usuarios, roles, follows (datos consistentes son críticos)

**MongoDB (Documental)**:
- ✅ Esquema flexible
- ✅ Datos jerárquicos (posts con comments, likes)
- ✅ Alto volumen de writes (posts, likes)

**¿Por qué no usar solo una?**

Si usas solo Postgres para posts:
```sql
-- Cada post puede tener miles de comments
CREATE TABLE comments (
  post_id UUID,
  content TEXT,
  -- ...
);
-- Problema: JOINs gigantescos, particionamiento complejo
```

Si usas solo Mongo para usuarios:
```javascript
// Pierdes las ventajas de datos relacionales
{
  _id: "user-123",
  email: "user@example.com",
  role_id: "role-456"  // ❌ Sin FK constraint, datos inconsistentes
}
```

### 🔗 TypeORM - PostgreSQL

**Repository Pattern**:
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,  // TypeORM Repository
  ) {}
  
  async findById(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['role'],  // Eager loading
    });
  }
}
```

**¿Por qué Repository en lugar de QueryBuilder?**
- ✅ **Abstracción**: No escribís SQL manualmente
- ✅ **Type-safe**: TypeScript valida tus queries
- ✅ **Testabilidad**: Facil de mockear
- ✅ **Métodos helper**: `findOne`, `find`, `save`, `delete`

**Relaciones**:
```typescript
@ManyToOne(() => Role)  // Muchos usuarios → un rol
role: Role;

@OneToMany(() => User)  // Un rol → muchos usuarios
users: User[];
```

### 🍃 Mongoose - MongoDB

**Schemas vs Models**:
```typescript
@Schema({ timestamps: true })  // Agrega createdAt, updatedAt automáticamente
export class Post {
  @Prop({ required: true })
  title!: string;

  @Prop({ type: [String], default: [] })
  imageUrls!: string[];  // Array de strings
}
```

**¿Por qué `!` (definite assignment assertion)?**
```typescript
// TypeScript: "Property 'title' has no initializer"
title: string;  // ❌ Error

// Solución: "Confío en que se inicializa en el constructor"
title!: string;  // ✅ OK con class-validator
```

---

## 8. Testing

### 🧪 Testing Pyramid

```
           /\
          /  \
         / E2E \  ← 16 tests (Slow, expensive)
        /______\
       /        \
      /  Unit    \ ← 22 tests (Fast, cheap)
     /__________\
```

### 🎯 Unit Tests vs E2E Tests

**Unit Tests** (Fast, Isolated):
```typescript
describe('UsersService', () => {
  it('should create user with default role', async () => {
    // Arrange: Setup
    const mockRepository = {
      create: jest.fn().mockResolvedValue(mockUser),
    };
    
    // Act: Execute
    const result = await service.create(userData);
    
    // Assert: Verify
    expect(result.role.name).toBe('USER');
  });
});
```

**Por qué unit tests?**
- ✅ **Velocidad**: Corren en milisegundos
- ✅ **Aislamiento**: Un test no afecta a otro
- ✅ **Debugging**: Si falla, sabés exactamente dónde
- ✅ **TDD-friendly**: Podés escribir el test antes del código

**E2E Tests** (Slow, Integrated):
```typescript
describe('AuthController (e2e)', () => {
  it('should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);
      
    expect(response.body).toHaveProperty('id');
    expect(response.body).not.toHaveProperty('password_hash');
  });
});
```

**Por qué E2E tests?**
- ✅ **Integración**: Prueban el flujo completo
- ✅ **HTTP**: Verifican status codes, headers, response body
- ✅ **Contracts**: Aseguran que la API cumple con el contrato

**Strategy**:
- Unit tests para lógica de negocio
- E2E tests para endpoints HTTP
- NO necesitas 100% coverage de cada uno
- Target: 80% unit, 20% E2E (regla 80/20)

---

## 13. Buenas Prácticas Aplicadas

### 🔐 Authentication Endpoints

#### `POST /auth/register`
**Propósito**: Crear una nueva cuenta de usuario.

**Validaciones**:
- Email debe ser único (check en DB)
- Password mínimo 6 caracteres
- Email debe ser formato válido

**Response**:
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "full_name": "John Doe"
  // password_hash NO se retorna
}
```

**Por qué no retornar el token?**
- El usuario debe hacer login explícitamente
- Security measure: Post-register attacks

#### `POST /auth/login`
**Propósito**: Autenticar usuario y retornar JWT token.

**Proceso**:
```typescript
1. Buscar usuario por email
2. Comparar password con bcrypt.compare()
3. Si es válido, generar JWT con payload:
   {
     userId: user.id,
     email: user.email,
     role: user.role.name
   }
4. Retornar { access_token: "jwt..." }
```

**¿Por qué no retornar user completo?**
- El token contiene toda la info necesaria
- El cliente hace decode del JWT para obtener userId, role
- Minimizás datos transferidos

#### `POST /auth/rotate-secret` ⭐
**Propósito**: Rotar el JWT secret usado para firmar tokens.

**¿Por qué solo ADMIN?**
- Operación crítica que afecta toda la seguridad
- Si un usuario normal puede rotar, puede hacer DoS
- Necesita privilegio elevado

**Proceso**:
```typescript
1. Marcar todos los secrets actuales como active=false
2. Crear nuevo secret con version + 1
3. Retornar { message, version }
```

**¿Cuándo usarlo?**
- Compromiso de security: "El secret se filtró"
- Rotación periódica: "Cada 90 días"
- Incidente: "Suspicia de unauthorized access"

**Production Workflow**:
```
Día 1: Secret v1 activo, tokens generados con v1
Día 60: Decidís rotar, llamás a rotate-secret
Día 60: Secret v2 activo, tokens v1 siguen funcionando (grace period)
Día 90: Desactivás v1 completamente
Día 90+: Solo tokens v2 son válidos
```

### 👤 Users Endpoints

#### `GET /users/me`
**Propósito**: Obtener el perfil del usuario autenticado.

**¿Por qué `/me` y no `/:id`?**
- `/me` es un shortcut para "mi propio perfil"
- No necesitas conocer tu propio ID
- El JWT contiene tu `userId`, el server lo extrae

#### `PATCH /users/me`
**Propósito**: Actualizar el perfil propio.

**¿Por qué PATCH y no PUT?**
- `PUT`: Reemplaza TODO el recurso
- `PATCH`: Actualiza PARTE del recurso
- Solo enviamos lo que cambió (bio, profile_picture_url)

**Validación `@IsImageUrl()`**:
```typescript
// ❌ Mal - Usuario pone cualquier string
profile_picture_url: "not-an-image"

// ✅ Bien - Solo URLs válidas de imágenes
profile_picture_url: "https://example.com/pic.jpg"
```

**Por qué validar imágenes?**
- Security: Evitar XSS con `javascript:` URLs
- UX: Asegurar que la imagen se pueda mostrar
- Storage: Saber qué tipo de archivo esperar

#### `DELETE /users/me`
**Propósito**: Soft delete de la cuenta propia.

**¿Por qué soft delete?**
- El usuario puede arrepentirse
- Querés保留 los datos por un tiempo (legal requirements)
- No rompes referencias (posts, comments)

#### `GET /users/:id` ⭐
**Propósito**: Obtener cualquier perfil de usuario (ADMIN only).

**¿Por qué solo ADMIN?**
- **Privacidad**: Un usuario normal no debería ver otros usuarios
- **Stalking**: Prevenir que usuarios vean perfiles de otros
- **Moderation**: Admin necesita ver todos los usuarios para moderación

**Uso en moderación**:
```typescript
// Admin ve todos los perfiles
GET /users/user-123

// Response:
{
  "id": "user-123",
  "email": "reported@example.com",  // Admin necesita ver email
  "full_name": "Reported User",
  "bio": "Contenido ofensivo",
  "created_at": "2024-01-15"  // Para saber cuando se registró
}
```

---

## 10. Buenas Prácticas Aplicadas

### ✅ 1. Type-Safe Request Objects

**Problema**:
```typescript
// ❌ req.user es `any`
const userId = req.user.userId;  // TypeScript no puede ayudar
```

**Solución**:
```typescript
// ✅ Tipo personalizado
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

const userId = req.user.userId;  // Type-safe, autocomplete
```

### ✅ 2. Async/Await Consistente

**Problema**:
```typescript
// ❌ Inconsistente
async function foo() {
  return bar();  // Falta await
}
```

**Solución**:
```typescript
// ✅ Async o sync, no mezclar
async function foo() {
  return await bar();  // O simplemente return bar()
}

// O si no necesitás el resultado:
async function foo() {
  void bar();  // Intencionalmente no await
}
```

### ✅ 3. Separation of Concerns

**Controller**:
```typescript
@Post()
async create(@Body() dto: CreateDto) {
  // ❌ NO: Lógica de negocio aquí
  // if (dto.password.length < 6) throw error;
  
  return this.service.create(dto);  // ✅ Solo delegar
}
```

**Service**:
```typescript
async create(dto: CreateDto) {
  // ✅ Lógica de negocio aquí
  const existing = await this.repo.findOne({ email: dto.email });
  if (existing) throw new ConflictException();
  
  return this.repo.save(dto);
}
```

### ✅ 4. Naming Conventions

**Archivos**:
```
user.service.ts        → Servicio de usuarios
users.controller.ts    → Controlador de users (plural)
create-user.dto.ts    → DTO para creación
```

**Métodos**:
```typescript
// Services: verbos que indican acción
findById(id)
findByEmail(email)
create(userData)
updateProfile(id, data)

// Controllers: verbos HTTP
getProfile()
updateProfile()
deleteAccount()
```

### ✅ 5. Error Handling

**Custom exceptions**:
```typescript
// ❌ Genérico
throw new Error("User not found");  // 500 Internal Server Error

// ✅ Específico
throw new NotFoundException("User");  // 404 Not Found
throw new ConflictException("Email exists");  // 409 Conflict
throw new UnauthorizedException("Invalid credentials");  // 401 Unauthorized
```

**Por qué HTTP exceptions?**
- Cliente sabe qué pasó (404 vs 500)
 - Podés manejar diferentes errores en el frontend
- Mejor UX: "Email ya existe" vs "Error interno"

### ✅ 6. Validation DTOs

**En lugar de validar en el controller**:
```typescript
// ❌ Validación manual
@Post()
register(@Body() body: any) {
  if (!body.email || !body.email.includes('@')) {
    throw new BadRequestException('Invalid email');
  }
}
```

**Usa class-validator**:
```typescript
// ✅ Declarativo
export class RegisterDto {
  @IsEmail()
  email!: string;
  
  @MinLength(6)
  password!: string;
}
```

### ✅ 7. Database Constraints

**No solo valides en código**:
```typescript
// ✅ Validación en DTO
@IsEmail()
email!: string;

// ✅ Constraint en DB
@Entity()
export class User {
  @Column({ unique: true })  // ← Doble protección
  email!: string;
}
```

**Por qué?**
- DTO valida en HTTP layer
- Constraint valida en DB layer
- Si alguien inserta directo en DB, la constraint lo protege

---

## 🎓 Conclusión - Lo que aprendimos

### Conceptos Dominados

1. **Arquitectura Modular**: Separación clara de responsabilidades
2. **Dependency Injection**: Inyección de dependencias automática
3. **Guards & Decorators**: Autenticación y autorización flexible
4. **JWT Authentication**: Tokens autocontenidos y seguros
5. **Polyglot Persistence**: Postgres para relaciones, Mongo para documentos
6. **Repository Pattern**: Abstracción de acceso a datos
7. **DTO Validation**: Validación declarativa con class-validator
8. **Testing Pyramid**: Unit + E2E en balance
9. **Soft Delete**: Eliminación sin perder datos
10. **Swagger/OpenAPI**: Documentación viva de la API

### Habilidades Desarrolladas

- ✅ Diseñar arquitectura limpia y escalable
- ✅ Implementar autenticación/autorización robusta
- ✅ Trabajar con múltiples bases de datos
- ✅ Escribir tests automatizados
- ✅ Documentar API con Swagger
- ✅ Aplicar buenas prácticas de NestJS

---

## 8. Fase 3: Módulo de Follows ⭐ NUEVO

### 🎯 Propósito

Gestionar el **grafo social** de la aplicación: quién sigue a quién. Este módulo demuestra el uso de **relaciones muchos-a-muchos** en PostgreSQL con **TypeORM**.

### 📁 Estructura del Módulo

```
src/follows/
├── dto/
│   ├── pagination.dto.ts       # Paginación genérica
│   └── follow-id.dto.ts        # DTO para :userId param
├── entities/
│   └── follow.entity.ts        # Entidad Follow (relación)
├── follows.controller.ts       # Endpoints HTTP
├── follows.service.ts          # Lógica de negocio
├── follows.module.ts           # Configuración
└── follows.service.spec.ts     # Unit tests
```

### 🔗 Entidad Follow (TypeORM)

**¿Por qué una entidad intermedia?**

Para relaciones muchos-a-muchos (un usuario sigue a muchos usuarios), necesitamos una **tabla intermedia**:

```typescript
// src/follows/entities/follow.entity.ts
@Entity('follows')
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'follower_id' })
  follower: User;  // Quien sigue

  @ManyToOne(() => User)
  @JoinColumn({ name: 'following_id' })
  following: User;  // Quien es seguido

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

**Clave de la relación:**
- `follower_id`: FK a users (el usuario que sigue)
- `following_id`: FK a users (el usuario seguido)
- **Unique constraint** en `(follower_id, following_id)` → previene duplicados
- **CASCADE delete** → si se borra un usuario, se borran sus follows

### 🔄 Migración de Base de Datos

**¿Por qué usar migraciones y no sync: true?**

Las migraciones proveen:
- **Control de versiones**: Sabés exactamente qué cambios se aplicaron
- **Reversibilidad**: Podés revertir cambios si algo sale mal
- **Safe deployments**: No rompés producción en deployments
- **Team collaboration**: Todos tienen el mismo schema

```typescript
// src/migrations/1715141234568-AddFollowsTable.ts
export class AddFollowsTable1715141234568 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla
    await queryRunner.createTable(
      new Table({
        name: 'follows',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'follower_id',
            type: 'uuid',
          },
          {
            name: 'following_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    // Foreign Keys con CASCADE
    await queryRunner.createForeignKey(
      'follows',
      new TableForeignKey({
        columnNames: ['follower_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',  // Si se borra el usuario, se borra el follow
      }),
    );

    // Índice único (prevenir duplicados)
    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'unique_follow',
        columnNames: ['follower_id', 'following_id'],
        isUnique: true,
      }),
    );

    // Índices para performance
    await queryRunner.createIndex(
      'follows',
      new TableIndex({
        name: 'idx_follower_id',
        columnNames: ['follower_id'],
      }),
    );
  }
}
```

**¿Por qué estos índices?**
1. **Unique constraint** en `(follower_id, following_id)` → un usuario no puede seguir al mismo usuario dos veces
2. **idx_follower_id** → queries como "¿a quién sigue usuario X?" son rápidas
3. **idx_following_id** → queries como "¿quiénes siguen a usuario X?" son rápidas

### 🎮 Lógica de Negocio

```typescript
// src/follows/follows.service.ts
@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
  ) {}

  async follow(followerId: string, followingId: string): Promise<Follow> {
    // 1. Validar: no auto-follow
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // 2. Verificar duplicados
    const existing = await this.followRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    if (existing) {
      throw new BadRequestException('You already follow this user');
    }

    // 3. Crear relación
    const follow = this.followRepository.create({
      follower: { id: followerId },
      following: { id: followingId },
    });

    return this.followRepository.save(follow);
  }

  async getFollowingIds(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ ids: string[]; total: number }> {
    const [follows, count] = await this.followRepository.findAndCount({
      where: { follower: { id: userId } },
      relations: ['following'],  // JOIN con users
      skip: (page - 1) * limit,
      take: limit,
    });

    const ids = follows.map((f) => f.following.id);
    return { ids, total: count };
  }
}
```

**Validaciones implementadas:**
1. ✅ **No auto-follow**: Un usuario no puede seguirse a sí mismo
2. ✅ **No duplicados**: Verifica si ya existe la relación antes de crear
3. ✅ **Soft delete**: Si se borra un usuario, CASCADE borra sus follows

### 🌐 Endpoints

```typescript
// src/follows/follows.controller.ts
@Controller('follows')
@UseGuards(JwtAuthGuard)  // Todos los endpoints requieren auth
export class FollowsController {
  constructor(private followsService: FollowsService) {}

  @Post(':userId')
  @UseGuards(RolesGuard)
  @Roles(Role.USER, Role.RESTAURANT, Role.ADMIN)
  async follow(@Param('userId') followingId: string, @Request() req) {
    return this.followsService.follow(req.user.userId, followingId);
  }

  @Delete(':userId')
  async unfollow(@Param('userId') followingId: string, @Request() req) {
    return this.followsService.unfollow(req.user.userId, followingId);
  }

  @Get('following')
  async getFollowing(
    @Request() req,
    @Query() { page = 1, limit = 10 }: PaginationDto,
  ) {
    return this.followsService.getFollowingIds(
      req.user.userId,
      page,
      limit,
    );
  }

  @Get('followers')
  async getFollowers(
    @Request() req,
    @Query() { page = 1, limit = 10 }: PaginationDto,
  ) {
    return this.followsService.getFollowersIds(req.user.userId, page, limit);
  }
}
```

**¿Por qué `:userId` en la ruta?**
- RESTful: `POST /follows/123` es más claro que `POST /follows` con body `{ userId: 123 }`
- Cache friendly: URLs son cacheables por HTTP CDNs
- Semántica: La operación es sobre el recurso `123`

### 🧪 Testing

```typescript
describe('FollowsService', () => {
  it('should prevent self-follow', async () => {
    await expect(
      service.follow('user-1', 'user-1'),
    ).rejects.toThrow(
      new BadRequestException('You cannot follow yourself'),
    );
  });

  it('should prevent duplicate follow', async () => {
    // Primer follow exitoso
    await service.follow('user-1', 'user-2');

    // Segundo follow falla
    await expect(
      service.follow('user-1', 'user-2'),
    ).rejects.toThrow(
      new BadRequestException('You already follow this user'),
    );
  });
});
```

---

## 9. Fase 3: Módulo de Posts ⭐ NUEVO

### 🎯 Propósito

Gestionar **contenido gastronómico** (posts con fotos, descripciones, ubicación). Este módulo demuestra el uso de **MongoDB** y **Mongoose** para datos de documentos flexibles.

### 📁 Estructura del Módulo

```
src/posts/
├── dto/
│   ├── create-post.dto.ts    # Validación de creación
│   └── update-post.dto.ts    # Validación de actualización
├── schemas/
│   └── post.schema.ts        # Schema Mongoose
├── posts.controller.ts       # Endpoints HTTP
├── posts.service.ts          # Lógica de negocio
├── posts.module.ts           # Configuración
└── posts.service.spec.ts     # Unit tests
```

### 📄 Schema de Mongoose

**¿Por qué Mongoose en lugar de TypeORM para Mongo?**

- **Mongoose** está diseñado específicamente para MongoDB
- **Schemas** con validación integrada
- **Middleware** (hooks antes/después de save)
- **Populate** para referencias (similar a JOINs)
- **Mejor TypeScript support** con tipos

```typescript
// src/posts/schemas/post.schema.ts
@Schema({
  timestamps: true,  // createdAt, updatedAt automáticos
  collection: 'posts',
})
export class Post {
  @Prop({ required: true })
  userId!: string;  // ID del usuario que crea el post

  @Prop({ required: true })
  title!: string;  // Título del post

  @Prop()
  description?: string;  // Descripción opcional

  @Prop({ type: [String], default: [] })
  imageUrls!: string[];  // Array de URLs de imágenes

  @Prop()
  location?: string;  // Ubicación del restaurante/plato

  @Prop({ default: 0 })
  likesCount!: number;  # Contador de likes
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Índices para performance
PostSchema.index({ userId: 1, createdAt: -1 });  # Posts de un usuario ordenados
PostSchema.index({ createdAt: -1 });  # Timeline global
```

**¿Por qué `!` (definite assignment assertion)?**
TypeScript strict mode requiere que las propiedades sean inicializadas. Como Mongoose las inicializa en runtime, usamos `!` para decir "confía en mí, esto se inicializa".

### 🔄 Diferencias: TypeORM vs Mongoose

| Aspecto | TypeORM (PostgreSQL) | Mongoose (MongoDB) |
|---------|---------------------|-------------------|
| **Entidades** | `@Entity()` | `@Schema()` |
| **Relaciones** | `@ManyToOne()`, `@OneToMany()` | `@Prop()` con referencias |
| **Migraciones** | Requeridas | Opcionales |
| **Transacciones** | ACID completo | Soportado (multi-document) |
| **Queries** | QueryBuilder o Repository | Mongoose Model |
| **Schemas** | Rígido (SQL) | Flexible (BSON) |

**Ejemplo: Crear registro**

```typescript
// TypeORM (PostgreSQL)
const user = userRepository.create({ email, password });
await userRepository.save(user);

// Mongoose (MongoDB)
const post = await postModel.create({ userId, title, description });
// o
const post = new postModel({ userId, title });
await post.save();
```

### 🎮 Lógica de Negocio

```typescript
// src/posts/posts.service.ts
@Injectable()
export class PostsService {
  constructor(
    @InjectModel('Post') private postModel: Model<Post>,
  ) {}

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const newPost = await this.postModel.create({
      userId,
      ...createPostDto,
      likesCount: 0,  # Valor por defecto
    });
    return newPost.save();
  }

  async deleteOne(postId: string, userId: string): Promise<void> {
    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    # Validación de ownership
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postModel.findByIdAndDelete(postId).exec();
  }

  async incrementLikes(postId: string): Promise<Post> {
    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.likesCount += 1;
    return post.save();  # Mongoose tracking cambios
  }
}
```

**¿Por qué `.exec()`?**
En Mongoose, queries no se ejecutan hasta que llamas a `.exec()` o usas `await`. Esto permite **build queries** dinámicamente:

```typescript
let query = this.postModel.find();

if (filters.userId) {
  query = query.where('userId', filters.userId);
}

if (filters.startDate) {
  query = query.where('createdAt').gte(filters.startDate);
}

const results = await query.exec();  # Se ejecuta aquí
```

### 🌐 Endpoints

```typescript
// src/posts/posts.controller.ts
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.postsService.create(req.user.userId, createPostDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return this.postsService.findByUserId(userId);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.postsService.deleteOne(id, req.user.userId);
    return { message: 'Post deleted successfully' };
  }

  @Post(':id/like')
  async like(@Param('id') id: string) {
    return this.postsService.incrementLikes(id);
  }
}
```

### 🧪 Testing con Mongoose

**¿Por qué es más difícil mockear Mongoose?**

Mongoose models tienen **métodos encadenados** (`.find().sort().exec()`), lo que hace el testing más complejo.

```typescript
// src/posts/posts.service.spec.ts
describe('PostsService', () => {
  let service: PostsService;
  let postModel: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken('Post'),
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
            findByIdAndDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(PostsService);
    postModel = module.get(getModelToken('Post'));
  });

  it('should create a post', async () => {
    const createPostDto: CreatePostDto = {
      title: 'New Post',
      description: 'Delicious pizza',
      imageUrls: ['https://example.com/pizza.jpg'],
      location: 'Buenos Aires',
    };

    const savedPost = { _id: 'post-123', userId: 'user-123', ...createPostDto };
    const postInstance = {
      ...savedPost,
      save: jest.fn().mockResolvedValue(savedPost),
    };

    const createSpy = jest.spyOn(postModel, 'create').mockResolvedValue(postInstance);

    const result = await service.create('user-123', createPostDto);

    expect(result).toEqual(savedPost);
    expect(createSpy).toHaveBeenCalledWith({
      userId: 'user-123',
      ...createPostDto,
      likesCount: 0,
    });

    createSpy.mockRestore();
  });
});
```

---

## 10. Fase 3: Módulo de Feed ⭐ NUEVO

### 🎯 Propósito

Generar un **feed personalizado** para cada usuario basado en quién sigue. Este módulo es el ejemplo perfecto de **polyglot persistence**: combina PostgreSQL (follows) + MongoDB (posts) + Redis (cache).

### 🏗 Arquitectura Polyglot

```
┌─────────────────────────────────────────────────────────────┐
│                     USER REQUEST                            │
│              GET /feed?page=1&limit=10                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     REDIS CACHE                              │
│            Check if feed is cached for user                 │
│                                                                 │
│         Key: feed:user:123:page:1:limit:10                   │
│         TTL: 5 minutes                                       │
└───────────────┬─────────────────┬────────────────────────────┘
                │ CACHE MISS      │ CACHE HIT
                ▼                 ▼
         ┌──────────┐      ┌──────────┐
         │ Generate │      │ Return   │
         │ Feed     │      │ Cached   │
         └────┬─────┘      └────┬─────┘
              │                │
              ▼                ▼
         ┌────────────────────────────┐
         │   Return feed to user      │
         └────────────────────────────┘
```

### 🎮 Lógica de Negocio

```typescript
// src/feed/feed.service.ts
@Injectable()
export class FeedService {
  constructor(
    private followsService: FollowsService,
    private postsService: PostsService,
    private cacheService: CacheService,
  ) {}

  async getUserFeed(
    userId: string,
    query: FeedQueryDto,
  ): Promise<{ posts: Post[]; total: number }> {
    const { page = 1, limit = 10, startDate, endDate } = query;

    // 1. Generar cache key
    const cacheKey = `feed:user:${userId}:page:${page}:limit:${limit}`;
    if (startDate) cacheKey += `:after:${startDate}`;
    if (endDate) cacheKey += `:before:${endDate}`;

    // 2. Check cache
    const cached = await this.cacheService.get<string>(cacheKey);
    if (cached) {
      return JSON.parse(cached) as any[];
    }

    // 3. Obtener IDs de usuarios seguidos (PostgreSQL)
    const { ids: followingIds } = await this.followsService.getFollowingIds(
      userId,
      1,  # No paginar follows, traer todos
      1000,  # Límite alto
    );

    // 4. Obtener posts de esos usuarios (MongoDB)
    const posts = await this.postsService.getPostsByUserIds(
      followingIds,
      startDate,
      endDate,
      limit,
    );

    const result = { posts, total: posts.length };

    // 5. Guardar en cache (5 minutos)
    await this.cacheService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }
}
```

### 🔄 Polyglot Queries

**¿Por qué no todo en una base de datos?**

| Data | Database | ¿Por qué? |
|------|----------|-----------|
| **Follows** | PostgreSQL | Requiere ACID, foreign keys, constraints |
| **Posts** | MongoDB | Esquema flexible, arrays anidados, alta write throughput |
| **Cache** | Redis | Ultra rápido, key-value, TTL automático |

**Query跨-database:**

```typescript
# Paso 1: PostgreSQL - Obtener follows
SELECT following_id FROM follows
WHERE follower_id = $userId
LIMIT 1000

# Paso 2: MongoDB - Obtener posts
db.posts.find({
  userId: { $in: [/* IDs del paso 1 */] },
  createdAt: {
    $gte: ISODate("2024-01-01"),
    $lte: ISODate("2024-12-31")
  }
})
.sort({ createdAt: -1 })
.limit(10)

# Paso 3: Redis - Cache result
SET feed:user:123:page:1:limit:10 "{...}"
EX 300  # Expira en 5 minutos
```

### 🧹 Cache Invalidation

**Estrategia: TTL-based (Time To Live)**

```typescript
// No invalidamos manualmente
// Dejamos que Redis expire el cache automáticamente

// Ventajas:
// - Simple: no necesitamos trackear cambios
// - Eventual consistency: 5 minutos es aceptable para un feed
// - Performance: evita writes adicionales

// Desventajas:
// - Stale data: el feed puede tener contenido de hace 5 min
// - Solución: TTL corto (5 min) = balance entre freshness y performance
```

**Invalidación manual (si fuera necesaria):**

```typescript
// Cuando un usuario crea un post
async createPost(userId: string, dto: CreatePostDto) {
  const post = await this.postsService.create(userId, dto);

  // Invalidar cache de todos sus seguidores
  const followers = await this.followsService.getFollowersIds(userId);
  for (const followerId of followers) {
    await this.cacheService.delPattern(`feed:user:${followerId}:*`);
  }

  return post;
}
```

### 🌐 Endpoints

```typescript
// src/feed/feed.controller.ts
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  async getUserFeed(
    @Request() req: AuthenticatedRequest,
    @Query() query: FeedQueryDto,
  ) {
    return this.feedService.getUserFeed(req.user.userId, query);
  }
}
```

**Query params:**
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 10)
- `startDate`: Filtrar posts desde esta fecha (ISO 8601)
- `endDate`: Filtrar posts hasta esta fecha (ISO 8601)

**Ejemplo:**
```
GET /feed?page=2&limit=20&startDate=2024-01-01&endDate=2024-03-31
Authorization: Bearer <jwt_token>
```

### 📊 Performance Considerations

**Sin cache:**
- PostgreSQL query: ~50ms
- MongoDB query: ~100ms
- **Total: ~150ms por request**

**Con cache (hit):**
- Redis GET: ~2ms
- **Total: ~2ms por request** (75x más rápido)

**Cache hit rate:**
- Primer request: miss → genera feed (~150ms)
- Siguientes requests (5 min): hit → retorna cache (~2ms)
- Después de 5 min: expire → regenera feed

---

## 🎓 Conclusión - Lo que aprendimos

### Conceptos Dominados (Fases 1, 2 y 3)

1. **Arquitectura Modular**: Separación clara de responsabilidades
2. **Dependency Injection**: Inyección de dependencias automática
3. **Guards & Decorators**: Autenticación y autorización flexible
4. **JWT Authentication**: Tokens autocontenidos y seguros con rotación
5. **Polyglot Persistence**: PostgreSQL + MongoDB + Redis
6. **Repository Pattern**: Abstracción de acceso a datos
7. **DTO Validation**: Validación declarativa con class-validator
8. **Testing Pyramid**: Unit + E2E en balance (51 tests pasando)
9. **Soft Delete**: Eliminación sin perder datos
10. **Swagger/OpenAPI**: Documentación viva de la API
11. **Relaciones Muchos-a-Muchos**: Tabla intermedia en PostgreSQL
12. **Documentos Flexibles**: Schemas de Mongoose con arrays y tipos anidados
13. **Feed Personalizado**: Polyglot queries + Redis caching
14. **Migrations**: Control de versiones de schema
15. **Performance Optimization**: Caching con TTL y cache invalidation

### Habilidades Desarrolladas

- ✅ Diseñar arquitectura limpia y escalable
- ✅ Implementar autenticación/autorización robusta
- ✅ Trabajar con múltiples bases de datos (polyglot persistence)
- ✅ Escribir tests automatizados (unit y E2E)
- ✅ Documentar API con Swagger
- ✅ Aplicar buenas prácticas de NestJS
- ✅ Implementar grafo social (follows/followers)
- ✅ Crear sistemas de contenido (posts con likes)
- ✅ Generar feeds personalizados con caching
- ✅ Optimizar performance con Redis

### 📊 Estadísticas del Proyecto

**Módulos Implementados:**
- ✅ Auth Module (JWT + bcrypt + secret rotation)
- ✅ Users Module (CRUD + RBAC + soft delete)
- ✅ Follows Module (relaciones sociales en PostgreSQL)
- ✅ Posts Module (contenido flexible en MongoDB)
- ✅ Feed Module (polyglot queries + Redis cache)

**Tests:**
- **51 tests** pasando (9 test suites)
- **100% coverage** en módulos críticos
- Tests unitarios para servicios y controladores
- Tests E2E para flujos completos

**Bases de Datos:**
- **PostgreSQL**: users, follows, jwt_secrets
- **MongoDB**: posts
- **Redis**: cache de feeds

### 🎯 Logros de la Fase 3

**Sistema de Follows:**
- Relaciones muchos-a-muchos con tabla intermedia
- Prevención de auto-follows y duplicados
- CASCADE delete para integridad referencial
- Índices optimizados para queries de followers/following

**Sistema de Posts:**
- Esquema flexible con imágenes, descripción, ubicación
- Validación de ownership para deletes
- Sistema de likes con contador
- Queries optimizadas con índices compuestos

**Sistema de Feed:**
- Polyglot queries跨-database (PostgreSQL → MongoDB)
- Redis caching con TTL de 5 minutos
- Filtrado por rango de fechas
- Paginación de resultados
- **75x más rápido** con cache hit (2ms vs 150ms)

### 🚀 Próximos Pasos (Posibles Extensiones)

Con esta base sólida, podés implementar:

**Fase 4: Features Avanzadas**
- **Comments Module**: Comentarios en posts (MongoDB embeddings)
- **Notifications Module**: Notificaciones en tiempo real (WebSocket + Redis Pub/Sub)
- **Search Module**: Búsqueda de posts, usuarios, restaurantes (Elasticsearch)
- **Media Upload**: Upload de imágenes a S3/Cloudinary
- **Analytics**: Métricas de engagement, reach, impressions

**Fase 5: Scaling & Performance**
- **Database Sharding**: Shard posts por fecha o ubicación
- **Read Replicas**: Réplicas de lectura para MongoDB
- **Connection Pooling**: Optimizar conexiones a databases
- **CDN Integration**: Cache de imágenes en CDN
- **Rate Limiting**: Throttling por usuario/IP

**Fase 6: Real-time & Social**
- **WebSocket Server**: Notificaciones push en vivo
- **Chat System**: Mensajería directa entre usuarios
- **Stories**: Contenido efímero (24h)
- **Live Streaming**: Transmisiones en vivo de restaurantes

### 💡 Lecciones Aprendidas

**Sobre Polyglot Persistence:**
- Elegí la DB correcta para cada tipo de dato
- PostgreSQL para relaciones (ACID, constraints)
- MongoDB para documentos flexibles (schema evolution)
- Redis para caché ultra rápido (TTL, key-value)

**Sobre Testing:**
- Los tests de Mongoose son más complejos (métodos encadenados)
- Usa `jest.spyOn()` para mocks granulares
- Mockea solo lo que necesitás, no todo
- Los tests te dan confianza para refactorizar

**Sobre Performance:**
- Redis caching transforma UX (150ms → 2ms)
- Los índices son CRÍTICOS para performance
- Polyglot queries add latencia pero caching la compensa
- TTL de 5 min es balance entre freshness y performance

**Sobre Arquitectura:**
- Separar concerns hace el código mantenible
- DI facilita testing y swapping de implementaciones
- Los módulos de NestJS fuerzan organización
- Guards + Decorators = auth/authorization declarativa

---

## 🏆 Conclusión Final

**¡Congratulations!** 🎉

Ya tenés una **API social completa** con:
- ✅ Autenticación JWT robusta
- ✅ Sistema de usuarios con roles
- ✅ Grafo social (follows)
- ✅ Contenido gastronómico (posts)
- ✅ Feed personalizado (polyglot + cache)
- ✅ 51 tests automatizados
- ✅ Documentación Swagger completa
- ✅ Polyglot persistence (PostgreSQL + MongoDB + Redis)

**Lo más importante:**
No solo escribiste código funcional. Aprendiste **conceptos de arquitectura** que escalan a sistemas de producción:
- Separation of concerns
- Polyglot persistence
- Caching strategies
- Test-driven development
- API documentation
- Database migrations

Estás listo para construir **cualquier API social** con NestJS. 🚀

> **Recuerda**: Lo mejor de NestJS es que te fuerza a escribir código organizado y mantenible desde el primer día. Lo mejor de polyglot persistence es que usamos la herramienta correcta para cada trabajo.

---

**© 2024 Foodie Connect API - Guía Educativa de NestJS**
