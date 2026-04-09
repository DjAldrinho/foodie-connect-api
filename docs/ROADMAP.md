# 🗺️ Foodie Connect - Roadmap Completo

> **Fecha**: 8 de abril de 2026
> **Estado actual**: Phase C completada (Search Module with Elasticsearch)

---

## 📊 Estado Actual

### ✅ Completado

**Fase 1: Foundation & Infrastructure**
- Docker Compose (PostgreSQL, MongoDB, Redis, pgAdmin, Mongo-Express)
- Environment configuration con validación
- Guards (JwtAuthGuard, RolesGuard) con jerarquía
- Custom decorators (@Roles, @IsImageUrl)
- Cache service con Redis
- ValidationPipe

**Fase 2: Authentication & Users**
- Auth Module (register, login, JWT rotation)
- Users Module (CRUD, soft delete, RBAC)
- Testing: 38 tests (29 unit + 16 E2E)
- Swagger/OpenAPI documentation

**Fase 3: Social Features**
- ✅ Follows Module (PostgreSQL) - relaciones usuarios
- ✅ Posts Module (MongoDB) - contenido gastronómico
- ✅ Feed Module (Polyglot + Redis) - feed personalizado
- Testing: 51 tests pasando

**Total de Tests (Fases 1-3):** 152 tests (aproximadamente 104 unit + 48 E2E)

**Phase A: Comments Module** (MongoDB)
- ✅ Comentarios anidados con parentCommentId
- ✅ Like/unlike comentarios
- ✅ Edición dentro de ventana de 5 minutos
- ✅ Menciones @usuario con regex
- ✅ Validación de ownership
- ✅ Soft delete
- Testing: 7 tests pasando

**Phase B: Notifications Module** (WebSocket + MongoDB)
- ✅ Notification schema con tipos (FOLLOW, LIKE, COMMENT, COMMENT_REPLY, POST)
- ✅ REST endpoints (get, markAsRead, markAllAsRead, delete, unread-count)
- ✅ WebSocket Gateway con rooms (notifications:userId)
- ✅ Helper methods (notifyFollow, notifyLike, notifyComment)
- ✅ Integración con app.module y CORS para WebSocket
- Testing: 11 tests pasando

**Phase C: Search Module** (Elasticsearch)
- ✅ Elasticsearch client integration con 3 índices (restaurants, posts, comments)
- ✅ Restaurant search: full-text, fuzzy matching, boost values (name^3)
- ✅ Advanced filters: cuisineType, priceRange, city, verified
- ✅ Geo-distance queries: búsqueda por ubicación con sorting por distancia
- ✅ Autocomplete: phrase_prefix matching para sugerencias
- ✅ Featured restaurants: verified + active filter
- ✅ Post search: content search con pagination
- ✅ Comment search: content search con operator AND
- ✅ Bulk indexing: TypeORM integration para restaurants
- ✅ Health check endpoint para monitoreo
- ✅ 7 REST endpoints completos
- Testing: 41 tests pasando (26 service + 15 controller + E2E)

**Phase D: Media Upload Module** (Cloudinary + Sharp)
- ✅ MediaService con integración Cloudinary para storage
- ✅ Sharp processing: thumbnail (200x200), medium (800x600), large (1920x1080)
- ✅ Conversión automática a WebP con optimización de calidad
- ✅ Validación de archivos (jpeg, png, webp | max 10MB)
- ✅ POST /media/upload endpoint con FileInterceptor
- ✅ CDN delivery automático via Cloudinary
- ✅ Organización por folders: original/, thumbnails/, medium/, large/
- Testing: 4 tests (2 service + 2 controller)

**Phase 4: Restaurant Profiles & Menu Management** (PostgreSQL + MongoDB)
- ✅ Restaurant entity con priceRange enum (BUDGET a LUXURY)
- ✅ Cuisine types, amenities, capacity, verified status
- ✅ Address JSONB con geo-coordinates
- ✅ Opening hours array por día de la semana
- ✅ Photo gallery integration con Cloudinary
- ✅ Owner verification (admin only endpoint)
- ✅ Active/inactive status para soft delete
- ✅ Menu schema nested (categories → items)
- ✅ CRUD operations para restaurants y menus
- ✅ Filters: cuisineType, priceRange, city, verified
- ✅ 12 endpoints REST completos

---

## 🎯 Plan Original - Fases Principales

### 📌 Phase 4: Restaurant Profiles 🍽️ ✅ COMPLETADA

**Objetivo**: Perfiles especializados para restaurantes (diferentes de usuarios regulares)

**Características**:
- **Restaurant Profile** (PostgreSQL)
  - Información del restaurante
  - Tipo de cocina (Italiana, Argentina, Asiática, etc.)
  - Rango de precios ($, $$, $$$)
  - Ubicación con mapa
  - Horarios de atención
  - Capacidad de mesas
  - WiFi, parking, delivery

- **Menu Management** (MongoDB - estructura flexible)
  - Categorías (Entradas, Platos Principales, Postres, Bebidas)
  - Platos con descripción
  - Precios
  - Fotos de platos
  - Ingredientes (alérgenos)
  - Disponibilidad

- **Restaurant Gallery**
  - Fotos del local
  - Fotos de platos destacados
  - Tours virtuales (videos)

- **Owner Verification**
  - Validación de dueño del restaurante
  - Documentación requerida
  - Admin approval process

**Entidades**:
```typescript
// PostgreSQL
@Entity('restaurants')
class Restaurant {
  id: UUID;
  userId: UUID;  // Owner
  name: string;
  cuisineType: string[];
  priceRange: number;  // 1-4
  address: Address;
  hours: OpeningHours[];
  verified: boolean;
}

// MongoDB
@Schema({ collection: 'menus' })
class Menu {
  restaurantId: UUID;
  categories: MenuCategory[];
  updatedAt: Date;
}
```

---

### 📌 Phase 5: Reviews and Ratings ⭐

**Objetivo**: Sistema completo de reseñas y calificaciones

**Características**:
- **Restaurant Reviews** (PostgreSQL - requiere ACID)
  - Rating 1-5 estrellas
  - Comentario detallado
  - Fotos de la experiencia
  - Fecha de visita
  - Verified visit (check-in)

- **Dish Reviews** (MongoDB)
  - Calificar platos específicos
  - Reviews por foto del plato
  - "Me gustó / No me gustó"

- **Rating Aggregation**
  - Promedio de ratings por restaurante
  - Distribución de ratings (cuántos 5*, 4*, etc.)
  - Rankings por categoría (mejores italianos, mejor precio-calidad)

- **Helpful Votes**
  - Votos "Útil" en reviews
  - Ordenar por most helpful

**Validaciones**:
- Solo un review por restaurante por visita
- No poder cambiar review después de 7 días
- Verificar que el usuario realmente visitó (si implementado check-in)

**Entidades**:
```typescript
// PostgreSQL
@Entity('restaurant_reviews')
class RestaurantReview {
  id: UUID;
  userId: UUID;
  restaurantId: UUID;
  rating: number;  // 1-5
  comment: text;
  visitDate: date;
  helpfulCount: number;
  createdAt: timestamp;
}

// MongoDB
@Schema({ collection: 'dish_reviews' })
class DishReview {
  userId: UUID;
  postId: UUID;  // Post del plato
  rating: number;
  liked: boolean;
  comment: string;
}
```

---

### 📌 Phase 6: Recommendations Algorithm 🤖

**Objetivo**: Sistema inteligente de recomendaciones personalizadas

**Características**:
- **Collaborative Filtering**
  - "Usuarios como vos visitaron..."
  - Basado en usuarios similares (misma preferencia de cocina, rating similar)

- **Content-Based Filtering**
  - "Te gustó X, probablemente te gustará Y"
  - Basado en tipos de cocina que calificaste alto
  - Ubicación cercana

- **Hybrid Approach**
  - Combinar collaborative + content-based
  - Ponderar según datos disponibles

- **Social Recommendations**
  - "Tus amigos fueron a..."
  - Restaurants visitados por follows con rating > 4

- **Trending / Popular**
  - Restaurants con más visitas en la última semana
  - Mejor rating recientemente

- **Personalized Feed**
  - Recomendaciones en home basadas en historial
  - Descubrimiento de nuevos tipos de cocina

**Algoritmos**:
```typescript
// Ejemplo de Collaborative Filtering
class RecommendationService {
  async getSimilarUsers(userId: UUID): UUID[] {
    // Encontrar usuarios que visitaron mismos restaurantes
    // Con ratings similares (diferencia < 0.5 estrellas)
  }

  async recommendBasedOnSimilarUsers(userId: UUID): Restaurant[] {
    const similarUsers = await this.getSimilarUsers(userId);
    // Restaurants que les gustaron a similares
    // Que userId aún no visitó
  }
}
```

---

## 🚀 Plan Adicional - Features Técnicas

### 🔧 Phase A: Comments Module

**Objetivo**: Sistema de comentarios en posts

**Características**:
- Comentarios anidados (reply to comment)
- Reacciones (❤️ 👍 🔥)
- Edición dentro de los primeros 5 min
- Eliminación por autor o admin
- Mencionar usuarios (@username)

**Tech Stack**:
- **MongoDB** (schema flexible para nested comments)

---

### 🔔 Phase B: Notifications Module

**Objetivo**: Sistema de notificaciones en tiempo real

**Características**:
- Alguien te siguió
- Alguien comentó tu post
- Alguien dio like a tu post
- Un restaurante que seguiste abrió/actualizó menú
- Review responses

**Tech Stack**:
- **WebSocket** (Socket.io) para real-time
- **Redis Pub/Sub** para broadcast
- **MongoDB** para historial de notificaciones

---

### 🔍 Phase C: Search Module ✅ COMPLETADA

**Objetivo**: Búsqueda potente y flexible

**Características**:
- ✅ Buscar restaurantes (nombre, cocina, ubicación)
- ✅ Buscar posts por contenido
- ✅ Buscar comentarios por texto
- ✅ Autocomplete con phrase_prefix
- ✅ Filtros avanzados (precio, rating, distancia)
- ✅ Geo-distance queries para búsqueda por ubicación
- ✅ Destacados (sponsored/featured)

**Tech Stack**:
- ✅ **Elasticsearch** para búsqueda de texto
- ✅ **Geo-distance queries** (ubicación)
- ✅ **Multi-index search** (restaurants, posts, comments)
- ✅ **Fuzzy search** con AUTO fuzziness
- ✅ **Boost values** para relevancia (name^3, content^2)

---

### 📸 Phase D: Media Upload

**Objetivo**: Sistema de carga de imágenes y videos

**Características**:
- Upload de imágenes
- Compresión automática
- Múltiples tamaños (thumbnail, medium, large)
- CDN delivery
- Video support (futuro)

**Tech Stack**:
- **AWS S3** o **Cloudinary**
- **Sharp** para procesamiento de imágenes

---

### 📊 Phase E: Analytics

**Objetivo**: Métricas y estadísticas para usuarios y restaurantes

**Características**:
- Dashboard para usuarios
- Dashboard para restaurantes (estadísticas de su perfil)
- Engagement metrics
- Popular posts/restaurants
- Visitas, impresiones, clicks

**Tech Stack**:
- **PostgreSQL** para aggregates
- **Redis** para caché de stats
- **Chart.js** o similar para visualización

---

## 🗓️ Orden Sugerido de Implementación

### Short Term (Próximas 2-3 semanas)
1. ~~**Phase A: Comments**~~ ✅ COMPLETADA - natural continuation after Posts
2. ~~**Phase D: Media Upload**~~ ✅ COMPLETADA - needed for good UX
3. ~~**Phase 4: Restaurant Profiles**~~ ✅ COMPLETADA - core business value

### Medium Term (1-2 meses)
4. **Phase 5: Reviews** - once restaurants exist
5. ~~**Phase C: Search**~~ ✅ COMPLETADA
6. ~~**Phase B: Notifications**~~ ✅ COMPLETADA - engagement boost

### Long Term (3+ meses)
7. **Phase E: Analytics** - business intelligence
8. **Phase 6: Recommendations** - advanced ML/AI

---

## 💡 Decisiones Pendientes

1. **Check-in System**: ¿Implementar verificación de visita físicamente?
2. **Verification**: ¿Cómo verificar que un usuario es dueño del restaurante?
3. **Premium Features**: ¿Alguna funcionalidad de pago?
4. **Moderation**: ¿Sistema de reportes y moderación de contenido?
5. **Multi-language**: ¿Soporte para múltiples idiomas?

---

## 📝 Notas

- Este roadmap es flexible y puede cambiar según necesidades del negocio
- Cada fase puede requerir ajustes en fases anteriores
- Priorizar basado en feedback de usuarios
- Mantener arquitectura polyglot (PostgreSQL + MongoDB + Redis + otros según necesidad)

---

**© 2024 Foodie Connect - Living Roadmap**
