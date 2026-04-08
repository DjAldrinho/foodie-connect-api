# Foodie Connect API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">Gastronomic Social Network API with Polyglot Persistence</p>

## Description

Foodie Connect API is a social network for gastronomy enthusiasts built with NestJS, featuring polyglot persistence (PostgreSQL + MongoDB), JWT authentication, role-based access control, and Redis caching.

## Tech Stack

- **Framework**: NestJS 11 + TypeScript 5.7
- **API Documentation**: Swagger/OpenAPI 3.0
- **Relational DB**: PostgreSQL 15 (TypeORM)
- **Document DB**: MongoDB 6 (Mongoose)
- **Caching**: Redis 7
- **Authentication**: JWT (Passport-JWT) + bcrypt
- **Validation**: class-validator + class-transformer
- **Testing**: Jest + Supertest

## Project Structure

```
src/
├── auth/              # JWT authentication module
│   ├── dto/           # Login, Register, RotateSecret DTOs
│   ├── entities/      # Secret entity (JWT rotation)
│   ├── strategies/    # JWT Passport strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/            # User management module
│   ├── dto/           # UpdateUserDto
│   ├── entities/      # User, Role entities
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── common/           # Shared utilities
│   ├── cache/        # Redis cache service
│   ├── decorators/   # @Roles, @IsImageUrl
│   ├── guards/        # JwtAuthGuard, RolesGuard
│   ├── pipes/         # ValidationPipe
│   └── types/        # Request types
├── config/           # Configuration module
└── migrations/       # TypeORM database migrations
```

## Implemented Features (Phase 1 & 2)

### ✅ Phase 1: Foundation & Infrastructure
- Docker Compose with PostgreSQL, MongoDB, Redis, pgAdmin, Mongo-Express
- Environment configuration with validation
- Guards (JwtAuthGuard, RolesGuard) with role hierarchy
- Custom decorators (@Roles, @IsImageUrl)
- Cache service with Redis integration
- Validation pipe for DTOs
- **Swagger/OpenAPI Documentation**:
  - Interactive API documentation at `/api`
  - JWT bearer authentication configuration
  - Request/response examples for all endpoints
  - DTOs with ApiProperty decorators
  - Admin-only route markers

### ✅ Phase 2: Authentication & Users
- **Auth Module**:
  - User registration with email uniqueness check
  - JWT authentication with bcrypt (10 rounds)
  - JWT rotation support for production scenarios
  - Multi-secret validation from database
  
- **Users Module**:
  - CRUD operations with soft delete
  - Role-based access control (ADMIN, USER, RESTAURANT)
  - Profile management (bio, profile_picture_url)
  - Public profile filtering (excludes password_hash)
  - Admin routes for user management

- **Database**:
  - TypeORM migrations for schema versioning
  - Seed script for default roles
  - Foreign keys and constraints

- **Testing**:
  - 29 unit tests (auth, users, guards, config)
  - 16 E2E tests covering auth flows and RBAC
  - 100% tests passing (38/38)

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ and Yarn
- Git

### Installation

1. **Clone the repository**:
```bash
git clone git@personal:DjAldrinho/foodie-connect-api.git
cd foodie-connect-api
```

2. **Install dependencies**:
```bash
yarn install
```

3. **Configure environment variables**:
```bash
# Copy example file and update with your values
cp .env.example .env
# Edit .env with your actual credentials
```

4. **Start Docker containers**:
```bash
docker-compose up -d
```

5. **Wait for databases to be ready** (~10 seconds):
```bash
# Check PostgreSQL is ready
docker-compose logs postgres | grep "database system is ready"

# Check MongoDB is ready
docker-compose logs mongo | grep "waiting for connections on"
```

6. **Run database migrations**:
```bash
yarn migration:run
```

7. **Seed default roles**:
```bash
yarn seed
```

8. **Start the application**:
```bash
# Development mode
yarn start:dev

# Production build
yarn build
yarn start:prod
```

The API will be available at `http://localhost:3000`

## 📖 API Documentation (Swagger UI)

Interactive API documentation is available via Swagger UI at:

```
http://localhost:3000/api
```

### Features

- **Interactive Testing**: Test all endpoints directly from the browser
- **Authentication Setup**: Configure JWT bearer token for protected routes
- **Request/Response Examples**: See example payloads and responses
- **Schema Validation**: View DTOs and validation rules
- **Admin Routes**: Clearly marked admin-only endpoints

### Using Swagger UI with Authentication

1. Open `http://localhost:3000/api` in your browser
2. Click the **Authorize** button (lock icon)
3. Enter your JWT token: `Bearer <your_access_token>`
   - Get token from `/auth/login` endpoint first
4. Click **Authorize** to apply the token
5. Now you can test authenticated endpoints

### Available Tags

- **auth**: Authentication endpoints (register, login, rotate-secret)
- **users**: User management endpoints (profile, update, delete)

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login and get JWT | Public |
| POST | `/auth/rotate-secret` | Rotate JWT secret (admin only) | Admin |

### Users

| Method | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/users/me` | Get current user profile | JWT |
| PATCH | `/users/me` | Update profile (bio, picture) | JWT |
| DELETE | `/users/me` | Soft delete account | JWT |
| GET | `/users/:id` | Get any user profile | Admin |

## Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
nano .env  # or your preferred editor
```

**Required variables** (see `.env.example` for complete list):

```env
# Database Credentials
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

# MongoDB
MONGO_URI=mongodb://your_mongo_user:your_password@localhost:27017/foodie_db?authSource=admin

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long
```

**Note**: Never commit `.env` to version control. Use `.env.example` as a template with placeholder values.

## Database Schema

### PostgreSQL (TypeORM)

**roles** table:
- id (UUID, PK)
- name (enum: USER, RESTAURANT, ADMIN)

**users** table:
- id (UUID, PK)
- email (string, unique)
- password_hash (string)
- full_name (string)
- bio (text, nullable)
- profile_picture_url (string, nullable)
- role_id (UUID, FK → roles.id)
- created_at (timestamp)
- updated_at (timestamp)
- deleted_at (timestamp, nullable)

**jwt_secrets** table:
- id (UUID, PK)
- secret (string)
- version (integer)
- active (boolean)
- expires_at (timestamp)

### MongoDB (Mongoose)

Pending implementation in Phase 3:
- Posts (food posts with images, location, likes)
- Comments (post reactions)
- Follows (social graph)

## Testing

### Unit Tests
```bash
yarn test
```

### E2E Tests
```bash
yarn test:e2e
```

### Test Coverage
- Unit tests: 29 tests
- E2E tests: 16 tests
- Total: 38 tests (100% passing)

## Development

### Run in development mode
```bash
yarn start:dev
```

When the application starts:
- **API**: http://localhost:3000
- **Swagger UI**: http://localhost:3000/api
- **Health Check**: curl http://localhost:3000

### Run migration
```bash
yarn migration:generate -- -n migration_name
yarn migration:run
yarn migration:revert
```

### Run seed
```bash
yarn seed
```

### Code Quality
```bash
# Lint
yarn eslint

# Format
yarn prettier --write .

# Build
yarn build
```

## Git Workflow

### Current Branch Structure

- **feat/phase-1-2-auth-users**: Auth and Users modules (✅ Complete)
- **feat/phase-3-social**: Social features (🚀 In Progress)

### Why No PR to Main?

**Currently**, there are no branches in `main` to PR against. This repository uses a feature branch workflow where each phase has its own branch:

1. `feat/phase-1-2-auth-users` → Contains all auth and user work
2. `feat/phase-3-social` → Will contain social features
3. `main` → Will be the integration branch later

**How to merge** (when ready):
1. Create a PR from `feat/phase-1-2-auth-users` to `main`
2. Request review if working in a team
3. Merge after approval
4. Delete merged branch

**Current Status**: Feature branches are pushed to GitHub and ready for review whenever you decide to integrate them into main.

## Roadmap

### ✅ Phase 1 & 2: Foundation, Auth & Users
- [x] Infrastructure setup
- [x] Configuration and environment
- [x] Guards, decorators, and common utilities
- [x] JWT authentication
- [x] User management with RBAC
- [x] Database migrations
- [x] Swagger API documentation
- [x] Unit and E2E tests

### 🚧 Phase 3: Social Features (Next)
- [ ] Follow system (PostgreSQL)
- [ ] Posts with images (MongoDB)
- [ ] Comments and likes
- [ ] Feed aggregation with Redis cache

### 📋 Future Phases
- [ ] Phase 4: Restaurant profiles
- [ ] Phase 5: Reviews and ratings
- [ ] Phase 6: Recommendations algorithm

## License

MIT

## Author

**Aldray Narvaez** - [GitHub](https://github.com/DjAldrinho)

---

<p align="center">
  <i>Built with ❤️ for food lovers everywhere</i>
</p>
