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
8. [Testing](#8-testing)
9. [Endpoints y su Propósito](#9-endpoints-y-su-propósito)
10. [Buenas Prácticas Aplicadas](#10-buenas-prácticas-aplicadas)

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

## 9. Endpoints y su Propósito

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

### 🚀 Próximos Pasos (Phase 3)

Con estos fundamentos sólidos, estás listo para:
- **Follows Module**: Relaciones muchos-a-muchos en Postgres
- **Posts Module**: Documentos anidados en Mongo
- **Feed Module**: Agregación políglota + Redis cache

---

**¡Congratulations!** 🎉 Ya tenés una base sólida para construir APIs profesionales con NestJS.

> **Recuerda**: Lo mejor de NestJS es que te fuerza a escribir código organizado y mantenible desde el primer día.
