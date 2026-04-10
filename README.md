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
- **Elasticsearch** - Full-text search and fuzzy matching

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
- **NPM** - Package manager
- **Docker Compose** - Infrastructure orchestration

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

### ✅ Phase C: Search Module
- **Search Module** (Elasticsearch)
  - Full-text search with fuzzy matching across restaurants, posts, and comments
  - Restaurant search with advanced filters (cuisine type, price range, city, verification)
  - Geo-distance queries for location-based search (lat/lon/distance)
  - Autocomplete suggestions with phrase prefix matching
  - Featured/sponsored restaurants endpoint
  - Multi-index search across all content types
  - Field boosting for relevance (name^3, content^2)
  - Bulk indexing capabilities for restaurants
  - Pagination support on all search endpoints

### ✅ Phase 5: Reviews and Ratings
- **Restaurant Reviews Module** (PostgreSQL)
  - Rating 1-5 stars with detailed comments
  - Visit date tracking and verified visits (check-in)
  - Photo uploads for reviews
  - Helpful votes system
  - 7-day edit window with ownership validation
  - One review per restaurant per user
  - Rating aggregation and statistics
  - Rating distribution (5★, 4★, 3★, 2★, 1★)

- **Dish Reviews Module** (MongoDB)
  - Rate specific dishes (linked to posts)
  - "Me gustó / No me gustó" quick feedback
  - Photo-based dish reviews
  - Helpful votes for dish reviews
  - 7-day edit window
  - Unique constraint: one review per dish per user
  - Rating statistics per dish

- **Rating Aggregation**
  - Average rating calculation
  - Rating distribution charts
  - Five-star percentage tracking
  - Most helpful sorting

### ✅ Phase 4: Restaurant Profiles & Menu Management
- **Restaurant Profiles Module** (PostgreSQL)
  - Restaurant profiles separate from regular users
  - Price range enum ($ to $$$$)
  - Cuisine types (Italiana, Argentina, Parrilla, etc.)
  - Address with geo-coordinates for maps
  - Opening hours by day of week
  - Amenities (WiFi, Parking, Delivery, AC, etc.)
  - Photo gallery integration with Cloudinary
  - Owner verification (admin approval)
  - Active/inactive status (soft delete)
  - Filters: cuisineType, priceRange, city, verified

- **Menu Management Module** (MongoDB)
  - Nested category structure (categories → items)
  - Items with price, description, photos, allergens, tags
  - Availability toggle per item
  - Add/remove categories and items
  - Integration with restaurant profiles

### ✅ Database Seeders
- **Role Seeder**
  - Creates base roles: USER, RESTAURANT, ADMIN, SUPER_ADMIN
  - Idempotent operation (skips existing roles)

- **Super Admin Seeder**
  - Creates super administrator user from environment variables
  - Reads credentials from .env: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_FULLNAME
  - Auto-assigns SUPER_ADMIN role
  - Updates existing user to SUPER_ADMIN if email already exists
  - Password hashing with bcrypt (10 salt rounds)

## 🏗 Architecture

### Polyglot Persistence
This project uses **polyglot persistence**, choosing the right database for each data type:

- **PostgreSQL** for structured, relational data:
  - User accounts and profiles
  - Follow relationships (requires ACID guarantees)
  - Authentication and authorization
  - Restaurant reviews (transactional data)

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
- `restaurants` - Restaurant profiles (priceRange, cuisineType, address, hours, amenities, verified)
- `restaurant_reviews` - Restaurant reviews with ratings, comments, helpful votes

**MongoDB Collections:**
- `posts` - User posts with images, likes, timestamps
- `comments` - Nested comments with parentCommentId, mentions, likes
- `dish_reviews` - Dish reviews with ratings, liked status, helpful votes
- `notifications` - Notification history with read status
- `menus` - Menu structure with nested categories and items

**Elasticsearch Indices:**
- `foodie-connect-restaurants` - Restaurant documents (name, cuisineType, priceRange, location, ratings)
- `foodie-connect-posts` - Post documents (content, location, username, likes, createdAt)
- `foodie-connect-comments` - Comment documents (content, username, mentions, createdAt)

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **API JSON**: http://localhost:3000/api/docs-json

### Main Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/rotate-secret` - Rotate JWT secret (admin only)
- `GET /api/auth/profile` - Get current user profile

#### Users (`/api/users`)
- `GET /api/users` - List all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user (self or admin)
- `DELETE /api/users/:id` - Soft delete user (admin)

#### Follows (`/api/follows`)
- `POST /api/follows/:userId` - Follow a user
- `DELETE /api/follows/:userId` - Unfollow a user
- `GET /api/follows/following` - Get following list (paginated)
- `GET /api/follows/followers` - Get followers list (paginated)

#### Posts (`/api/posts`)
- `POST /api/posts` - Create a new post
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/user/:userId` - Get posts by user
- `DELETE /api/posts/:id` - Delete own post
- `POST /api/posts/:id/like` - Like a post

#### Feed (`/api/feed`)
- `GET /api/feed` - Get personalized feed from followed users
  - Query params: `page`, `limit`, `startDate`, `endDate`

#### Comments (`/api/comments`)
- `POST /api/comments` - Create a new comment
- `GET /api/comments/post/:postId` - Get comments for a post (paginated)
- `PATCH /api/comments/:id` - Edit own comment (within 5 minutes)
- `DELETE /api/comments/:id` - Soft delete own comment
- `POST /api/comments/:id/like` - Like/unlike a comment
- `GET /api/comments/:id/replies` - Get replies to a comment (nested)

#### Notifications (`/api/notifications`)
- `GET /api/notifications` - Get user notifications (paginated)
- `GET /api/notifications/unread-count` - Get unread notifications count
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

#### Media (`/api/media`)
- `POST /api/media/upload` - Upload image with automatic optimization
  - Generates: thumbnail, medium, large sizes
  - Returns: URLs for all sizes, metadata, publicId
  - Supported formats: jpeg, png, webp (max 10MB)

#### Search (`/api/search`)
- `GET /api/search/restaurants` - Search restaurants with full-text and filters
  - Query params: `q`, `cuisineType`, `city`, `priceRange`, `verified`, `lat`, `lon`, `distance`, `page`, `limit`
  - Features: fuzzy search, geo-distance queries, relevance scoring
- `GET /api/search/posts` - Search posts by content
  - Query params: `q`, `userId`, `page`, `limit`
- `GET /api/search/comments` - Search comments by content
  - Query params: `q`, `postId`, `page`, `limit`
- `GET /api/search/autocomplete` - Get autocomplete suggestions
  - Query params: `q`, `type` (restaurants/all), `limit`
- `GET /api/search/featured` - Get featured/sponsored restaurants
  - Query params: `limit`
- `GET /api/search/health` - Check Elasticsearch connection
- `POST /api/search/index/restaurants` - Bulk index all restaurants (admin only)

#### Reviews (`/api/reviews`)
- `POST /api/reviews/restaurants` - Create a restaurant review
  - Body: rating (1-5), comment, visitDate, photos, verifiedVisit
- `GET /api/reviews/restaurants` - Get restaurant reviews (paginated)
  - Query params: `restaurantId`, `userId`, `minRating`, `page`, `limit`, `sortBy` (recent/helpful/rating)
- `GET /api/reviews/restaurants/:id` - Get restaurant review by ID
- `GET /api/reviews/restaurants/:id/stats` - Get rating statistics for a restaurant
  - Returns: averageRating, totalReviews, ratingDistribution, fiveStarPercentage
- `PATCH /api/reviews/restaurants/:id` - Update restaurant review (within 7 days)
- `DELETE /api/reviews/restaurants/:id` - Delete restaurant review
- `POST /api/reviews/restaurants/:id/helpful` - Mark restaurant review as helpful
- `POST /api/reviews/dishes` - Create a dish review
  - Body: postId, rating (1-5), liked, comment, photos
- `GET /api/reviews/dishes` - Get dish reviews (paginated)
  - Query params: `postId`, `userId`, `minRating`, `page`, `limit`, `likedOnly`
- `GET /api/reviews/dishes/:id` - Get dish review by ID
- `GET /api/reviews/dishes/:id/stats` - Get rating statistics for a dish
- `PATCH /api/reviews/dishes/:id` - Update dish review (within 7 days)
- `DELETE /api/reviews/dishes/:id` - Delete dish review
- `POST /api/reviews/dishes/:id/helpful` - Mark dish review as helpful

#### Restaurants (`/api/restaurants`)
- `POST /api/restaurants` - Create restaurant profile
- `GET /api/restaurants` - List all restaurants with filters
  - Query params: `cuisineType`, `priceRange`, `city`, `verified`
- `GET /api/restaurants/my-restaurant` - Get current user restaurant
- `GET /api/restaurants/:id` - Get restaurant by ID
- `PATCH /api/restaurants/:id` - Update restaurant information
- `PATCH /api/restaurants/:id/verify` - Verify restaurant (admin only)
- `PATCH /api/restaurants/:id/photos` - Add photo to gallery
- `DELETE /api/restaurants/:id/photos/:photoUrl` - Remove photo from gallery
- `PATCH /api/restaurants/:id/deactivate` - Deactivate restaurant (soft delete)
- `PATCH /api/restaurants/:id/activate` - Activate restaurant

#### Menus (`/api/menus`)
- `POST /api/menus` - Create or update menu for restaurant
- `GET /api/menus/restaurant/:restaurantId` - Get menu by restaurant
- `PATCH /api/menus/:id` - Update menu
- `POST /api/menus/:id/categories` - Add category to menu
- `PATCH /api/menus/:id/categories/:categoryName` - Remove category
- `POST /api/menus/:id/categories/:categoryName/items` - Add item to category
- `PATCH /api/menus/:id/categories/:categoryName/items/:itemName` - Remove item
- `PATCH /api/menus/:id/categories/:categoryName/items/:itemName/availability` - Toggle item availability

#### WebSocket Events (`/api/notifications`)
- Connection: `http://localhost:3000/notifications` (Socket.io client)
- Events: `joinNotifications`, `leaveNotifications`, `markAsRead`
- Real-time updates: `notification-updated`, `unread-count`

## 🔧 Configuration

### Environment Variables
Create a `.env` file based on `.env.example`:

```env
# =============================================================================
# FOODIE CONNECT API - ENVIRONMENT VARIABLES
# =============================================================================
# Rename this file to .env and update with your actual values
# DO NOT commit .env file to version control

# Application
PORT=3000
NODE_ENV=development

# PostgreSQL Configuration (TypeORM)
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password_here
DB_DATABASE=foodie_db
DB_SYNCHRONIZE=false
DB_LOGGING=true

# MongoDB Configuration (Mongoose)
MONGO_USER=your_mongo_user
MONGO_PASSWORD=your_mongo_password_here
MONGO_PORT=27017
MONGO_URI=mongodb://your_mongo_user:your_mongo_password_here@localhost:27017/foodie_db?authSource=admin

# JWT Configuration
# Generate with: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long

# pgAdmin Configuration (Optional - for database GUI)
PGADMIN_EMAIL=your@email.com
PGADMIN_PASSWORD=your_pgadmin_password
PGADMIN_PORT=5051

# Mongo-Express Configuration (Optional - for MongoDB GUI)
ME_USER=admin
ME_PASSWORD=your_mongo_express_password
ME_PORT=8081

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Redis Commander Configuration
REDIS_COMMANDER_PORT=8082

# Frontend Configuration
FRONTEND_URL=http://localhost:3001

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Elasticsearch Configuration
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_NODE_PORT=9300
ELASTICSEARCH_NODE=http://localhost:9200

# Kibana Configuration
KIBANA_PORT=5601

# Super Admin Configuration (for database seeders)
SUPERADMIN_EMAIL=admin@foodieconnect.com
SUPERADMIN_PASSWORD=YourSecurePassword123!
SUPERADMIN_FULLNAME=Super Admin
```

### Quick Start with Docker Compose

The easiest way to start all required services:

```bash
# Start all infrastructure services
docker-compose up -d

# Services will be available at:
# - PostgreSQL: localhost:5433
# - MongoDB: localhost:27017
# - Redis: localhost:6379
# - Elasticsearch: localhost:9200
# - Kibana: http://localhost:5601
# - pgAdmin: http://localhost:5051
# - Mongo-Express: http://localhost:8081
# - Redis Commander: http://localhost:8082

# Check services status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Docker Compose Services

| Service | Port | Web UI | Purpose | Credentials |
|---------|------|--------|---------|-------------|
| **PostgreSQL** | 5433 | pgAdmin:5051 | Relational data | See .env |
| **MongoDB** | 27017 | Mongo-Express:8081 | Document data | See .env |
| **Redis** | 6379 | Redis Commander:8082 | Caching & sessions | Default: redis123 |
| **Elasticsearch** | 9200 | Kibana:5601 | Full-text search | None (dev mode) |
| **Kibana** | 5601 | http://localhost:5601 | Elasticsearch UI | - |

### Web Interfaces

- **Kibana** (Elasticsearch): http://localhost:5601
- **pgAdmin** (PostgreSQL): http://localhost:5051
- **Mongo-Express** (MongoDB): http://localhost:8081
- **Redis Commander** (Redis): http://localhost:8082

### Prerequisites
- **Node.js** 18+
- **NPM** (package manager)
- **Docker & Docker Compose** (for infrastructure services)

All infrastructure services run inside Docker containers.

## 🚦 Getting Started

```bash
# Clone repository
git clone <repository-url>
cd foodie-connect-api

# Install dependencies
npm install

# Start infrastructure services with Docker Compose
docker-compose up -d

# Wait for services to be healthy (check with docker-compose ps)

# Run database migrations
npm run migration:run

# Run database seeders (creates roles and super admin)
npm run seed

# Start development server
npm run start:dev

# Or build and run in production
npm run build
npm run start:prod
```

### Development Workflow

```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:cov

# Create a new migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
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
├── restaurants/       # Restaurant profiles module (PostgreSQL)
├── menus/             # Menu management module (MongoDB)
├── reviews/           # Reviews and ratings module (PostgreSQL + MongoDB)
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
- Production-ready Elasticsearch cluster

## 📝 License

This project is MIT licensed.

## 👥 Authors

- **Aldray Narvaez** - Initial work

## 🙏 Acknowledgments

- NestJS Team for the amazing framework
- TypeORM and Mongoose communities
- Open source contributors
