<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Foodie Connect API

Gastronomic Social Network API built with NestJS, featuring polyglot persistence architecture for optimal data storage.

## 🚀 Project Overview

Foodie Connect is a social network for food enthusiasts where users can share their culinary experiences through posts, follow other foodies, and discover content from people they follow.

## 🛠 Tech Stack

### Core Framework
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **TypeORM** - ORM for PostgreSQL
- **Mongoose** - ODM for MongoDB

### Databases (Polyglot Persistence)
- **PostgreSQL** - Relational data (users, follows, authentication)
- **MongoDB** - Document data (posts with flexible schemas)
- **Redis** - Caching layer for performance optimization

### Security & Features
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing (10 rounds)
- **Class Validator** - Request validation
- **Swagger** - API documentation

### Media & Storage
- **Cloudinary** - Cloud storage and CDN for images
- **Sharp** - High-performance image processing
- **Multer** - Multipart form data handling

### Development Tools
- **Jest** - Testing framework
- **ESLint** - Code linting with strict TypeScript rules
- **Prettier** - Code formatting

## 📋 Implemented Features

### ✅ Phase 1: Authentication & Users
- User registration and login
- JWT-based authentication with automatic token rotation
- Role-based access control (Admin, User)
- Password hashing with bcrypt
- Public and protected routes
- Comprehensive user management

### ✅ Phase 2: Documentation & Security
- Swagger/OpenAPI documentation at `/api`
- Comprehensive Spanish documentation (DOCS.md)
- Environment variable security (.env.example)
- ESLint configuration with strict type checking

### ✅ Phase 3: Social Features
- **Follows Module** (PostgreSQL)
  - Follow/unfollow users
  - Get followers and following lists
  - Paginated results
  - Prevention of self-follows and duplicates
  - CASCADE delete for data integrity

- **Posts Module** (MongoDB)
  - Create posts with images, title, description, and location
  - Get posts by user
  - Delete own posts (ownership validation)
  - Like/unlike posts
  - Flexible document schema

- **Feed Module** (Polyglot Persistence + Redis Cache)
  - Get personalized feed from followed users
  - Date range filtering
  - Pagination support
  - 5-minute Redis caching with automatic invalidation
  - Cross-database queries (PostgreSQL for follows, MongoDB for posts)

### ✅ Phase A: Comments Module
- **Comments Module** (MongoDB)
  - Nested comments with parentCommentId for thread-style replies
  - Like/unlike comments with array-based reactions
  - Edit comments within 5-minute window with ownership validation
  - Soft delete for content preservation
  - User mentions with @username pattern extraction
  - Pagination and filtering by post

### ✅ Phase B: Notifications Module
- **Notifications Module** (MongoDB + WebSocket)
  - Real-time notification delivery with Socket.io
  - Notification types: FOLLOW, LIKE, COMMENT, COMMENT_REPLY, POST
  - Room-based WebSocket (notifications:userId)
  - REST endpoints for notification management
  - Mark as read / Mark all as read
  - Unread count tracking
  - Soft delete for notifications

### ✅ Phase D: Media Upload Module
- **Media Upload Module** (Cloudinary + Sharp)
  - Image upload with automatic optimization
  - Multiple size generation: thumbnail (200x200), medium (800x600), large (1920x1080)
  - Automatic WebP conversion with quality optimization
  - Cloudinary CDN delivery for fast loading
  - File validation (jpeg, png, webp | max 10MB)
  - Organized storage in folders: original/, thumbnails/, medium/, large/
  - DELETE endpoint for image removal

## 🏗 Architecture

### Polyglot Persistence
This project uses **polyglot persistence**, choosing the right database for each data type:

- **PostgreSQL** for structured, relational data:
  - User accounts and profiles
  - Follow relationships (requires ACID guarantees)
  - Authentication and authorization

- **MongoDB** for flexible, document data:
  - Posts (variable structure, nested fields)
  - Content with arrays (images, tags)
  - High write throughput for social features

- **Redis** for performance:
  - Feed caching (5-minute TTL)
  - Session data (future)
  - Rate limiting (future)

### Database Schema

**PostgreSQL Tables:**
- `users` - User accounts with roles
- `follows` - Social graph (follower_id, following_id)

**MongoDB Collections:**
- `posts` - User posts with images, likes, timestamps
- `comments` - Nested comments with mentions and reactions
- `notifications` - Notification history with read status

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api
- **API JSON**: http://localhost:3000/api-json

### Main Endpoints

#### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/rotate-secret` - Rotate JWT secret (admin only)
- `GET /auth/profile` - Get current user profile

#### Users (`/users`)
- `GET /users` - List all users (admin)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user (self or admin)
- `DELETE /users/:id` - Soft delete user (admin)

#### Follows (`/follows`)
- `POST /follows/:userId` - Follow a user
- `DELETE /follows/:userId` - Unfollow a user
- `GET /follows/following` - Get following list (paginated)
- `GET /follows/followers` - Get followers list (paginated)

#### Posts (`/posts`)
- `POST /posts` - Create a new post
- `GET /posts/:id` - Get post by ID
- `GET /posts/user/:userId` - Get posts by user
- `DELETE /posts/:id` - Delete own post
- `POST /posts/:id/like` - Like a post

#### Feed (`/feed`)
- `GET /feed` - Get personalized feed from followed users
  - Query params: `page`, `limit`, `startDate`, `endDate`

#### Comments (`/comments`)
- `POST /comments` - Create a new comment
- `GET /comments/post/:postId` - Get comments for a post (paginated)
- `PATCH /comments/:id` - Edit own comment (within 5 minutes)
- `DELETE /comments/:id` - Soft delete own comment
- `POST /comments/:id/like` - Like/unlike a comment
- `GET /comments/:id/replies` - Get replies to a comment (nested)

#### Notifications (`/notifications`)
- `GET /notifications` - Get user notifications (paginated)
- `GET /notifications/unread-count` - Get unread notifications count
- `PATCH /notifications/:id/read` - Mark notification as read
- `PATCH /notifications/read-all` - Mark all notifications as read
- `DELETE /notifications/:id` - Delete notification

#### Media (`/media`)
- `POST /media/upload` - Upload image with automatic optimization
  - Generates: thumbnail, medium, large sizes
  - Returns: URLs for all sizes, metadata, publicId
  - Supported formats: jpeg, png, webp (max 10MB)

#### WebSocket Events
- `joinNotifications` - Join user's notification room
- `leaveNotifications` - Leave notification room
- `markAsRead` - Mark notification as read via WebSocket
- Real-time updates: `notification-updated`, `unread-count`

## 🔧 Configuration

### Environment Variables
Create a `.env` file based on `.env.example`:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=foodie_connect

# MongoDB
MONGODB_URI=mongodb://localhost:27017/foodie_connect

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Cloudinary (Media Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Application
PORT=3000
NODE_ENV=development
```

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+

## 🚦 Getting Started

```bash
# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

## 🧪 Testing

The project includes:
- **Unit tests** for all services and controllers
- **E2E tests** for API endpoints
- **Test coverage** reporting

```bash
# All tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📖 Documentation

For detailed NestJS concepts and project-specific documentation in Spanish, see **[DOCS.md](./DOCS.md)**.

Topics covered:
- NestJS fundamentals (modules, controllers, services)
- Dependency injection
- TypeORM entities and migrations
- Mongoose schemas
- Guards and decorators
- Custom decorators (@Roles, @Public)
- Polyglot persistence patterns
- Testing strategies

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **JWT Authentication**: Secure token-based auth with rotation support
- **Role-Based Access Control**: Admin and User roles
- **Input Validation**: Class-validator DTOs
- **SQL Injection Prevention**: TypeORM parameterized queries
- **XSS Protection**: Input sanitization
- **CORS**: Configured for frontend integration
- **Rate Limiting**: Configured (Redis-based in production)

## 📁 Project Structure

```
src/
├── auth/              # Authentication module
├── users/             # Users module (PostgreSQL)
├── follows/           # Follows module (PostgreSQL)
├── posts/             # Posts module (MongoDB)
├── feed/              # Feed module (Polyglot + Redis)
├── comments/          # Comments module (MongoDB)
├── notifications/     # Notifications module (MongoDB + WebSocket)
│   └── gateways/      # WebSocket gateway
├── media/             # Media upload module (Cloudinary + Sharp)
├── common/            # Shared utilities
│   ├── cache/         # Redis cache service
│   ├── guards/        # Auth & roles guards
│   ├── decorators/    # Custom decorators
│   └── types/         # TypeScript types
├── migrations/        # TypeORM migrations
└── main.ts           # Application entry point
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start:prod
```

### Environment Setup
Ensure all environment variables are set in production:
- Strong JWT_SECRET
- Secure database passwords
- Configured CORS origins
- Production-ready Redis instance

## 📝 License

This project is MIT licensed.

## 👥 Authors

- **Aldray Narvaez** - Initial work

## 🙏 Acknowledgments

- NestJS Team for the amazing framework
- TypeORM and Mongoose communities
- Open source contributors
