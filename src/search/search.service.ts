import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Post } from '../posts/schemas/post.schema';
import { Comment } from '../comments/entities/comment.entity';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly client: Client;
  private readonly indexPrefix = 'foodie-connect';

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    });
  }

  async onModuleInit() {
    await this.createIndices();
  }

  async createIndices() {
    const indices = [
      {
        name: `${this.indexPrefix}-restaurants`,
        mappings: {
          properties: {
            name: { type: 'text', boost: 3 },
            description: { type: 'text' },
            cuisineType: { type: 'keyword' },
            priceRange: { type: 'integer' },
            city: { type: 'keyword' },
            state: { type: 'keyword' },
            address: { type: 'text' },
            amenities: { type: 'keyword' },
            verified: { type: 'boolean' },
            active: { type: 'boolean' },
            location: { type: 'geo_point' },
            averageRating: { type: 'float' },
            totalReviews: { type: 'integer' },
          },
        },
      },
      {
        name: `${this.indexPrefix}-posts`,
        mappings: {
          properties: {
            content: { type: 'text', boost: 2 },
            location: { type: 'text' },
            username: { type: 'keyword' },
            userId: { type: 'keyword' },
            createdAt: { type: 'date' },
            likesCount: { type: 'integer' },
            images: { type: 'keyword' },
            isDeleted: { type: 'boolean' },
          },
        },
      },
      {
        name: `${this.indexPrefix}-comments`,
        mappings: {
          properties: {
            content: { type: 'text', boost: 2 },
            username: { type: 'keyword' },
            userId: { type: 'keyword' },
            postId: { type: 'keyword' },
            createdAt: { type: 'date' },
            likesCount: { type: 'integer' },
            mentions: { type: 'keyword' },
            isDeleted: { type: 'boolean' },
          },
        },
      },
    ];

    for (const index of indices) {
      const exists = await this.client.indices.exists({ index: index.name });

      if (!exists) {
        await this.client.indices.create({
          index: index.name,
          mappings: index.mappings as any,
        });
        this.logger.log(`Created index: ${index.name}`);
      }
    }
  }

  async indexRestaurant(restaurant: any) {
    await this.client.index({
      index: `${this.indexPrefix}-restaurants`,
      id: restaurant.id,
      body: {
        name: restaurant.name,
        description: restaurant.description || '',
        cuisineType: restaurant.cuisineType,
        priceRange: restaurant.priceRange,
        city: restaurant.address.city,
        state: restaurant.address.state,
        address: `${restaurant.address.street}, ${restaurant.address.city}`,
        amenities: restaurant.amenities,
        verified: restaurant.verified,
        active: restaurant.active,
        location: {
          lat: restaurant.address.latitude || 0,
          lon: restaurant.address.longitude || 0,
        },
        averageRating: 0, // Will be calculated in Phase 5
        totalReviews: 0, // Will be calculated in Phase 5
      },
    });
  }

  async indexPost(post: any, username: string) {
    await this.client.index({
      index: `${this.indexPrefix}-posts`,
      id: post._id.toString(),
      body: {
        content: post.content,
        location: post.location || '',
        username,
        userId: post.userId,
        createdAt: post.createdAt,
        likesCount: post.likes.length,
        images: post.images,
        isDeleted: false,
      },
    });
  }

  async indexComment(comment: any, username: string) {
    await this.client.index({
      index: `${this.indexPrefix}-comments`,
      id: comment._id.toString(),
      body: {
        content: comment.content,
        username,
        userId: comment.userId,
        postId: comment.postId,
        createdAt: comment.createdAt,
        likesCount: comment.likes.length,
        mentions: comment.mentions,
        isDeleted: comment.isDeleted,
      },
    });
  }

  async searchRestaurants(query: {
    q?: string;
    cuisineType?: string;
    city?: string;
    priceRange?: number;
    verified?: boolean;
    lat?: number;
    lon?: number;
    distance?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      q = '',
      cuisineType,
      city,
      priceRange,
      verified,
      lat,
      lon,
      distance = 10000, // 10km default
      page = 1,
      limit = 20,
    } = query;

    const must: any[] = [];
    const filter: any[] = [];

    // Text search
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['name^3', 'description', 'address'],
          type: 'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 2,
        },
      });
    }

    // Filters
    if (cuisineType) {
      filter.push({ term: { cuisineType } });
    }

    if (city) {
      filter.push({ term: { city } });
    }

    if (priceRange !== undefined) {
      filter.push({ term: { priceRange } });
    }

    if (verified !== undefined) {
      filter.push({ term: { verified } });
    }

    filter.push({ term: { active: true } });

    // Geo-distance query
    let sort: any = [{ _score: 'desc' }];
    if (lat && lon) {
      must.push({
        geo_distance: {
          distance: `${distance}km`,
          location: {
            lat,
            lon,
          },
        },
      });

      sort = [
        {
          _geo_distance: {
            unit: 'km',
            location: { lat, lon },
          },
        },
      ];
    }

    const boolQuery: any = {};

    if (must.length > 0) {
      boolQuery.must = must;
    }

    if (filter.length > 0) {
      boolQuery.filter = filter;
    }

    const searchBody: any = {
      query: {
        bool: boolQuery,
      },
      from: (page - 1) * limit,
      size: limit,
    };

    if (lat && lon && sort && sort.length > 0) {
      searchBody.sort = sort;
    }

    const result = await this.client.search({
      index: `${this.indexPrefix}-restaurants`,
      body: searchBody,
    } as any);

    return {
      results: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
        score: hit._score,
        distance: hit.sort && hit.sort[0] ? hit.sort[0] : undefined,
      })),
      total: (result.hits.total as any)?.value || result.hits.total || 0,
      page,
      limit,
    };
  }

  async searchPosts(query: {
    q?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const { q = '', userId, page = 1, limit = 20 } = query;

    const must: any[] = [{ term: { isDeleted: false } }];

    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['content^2', 'location'],
          fuzziness: 'AUTO',
        },
      });
    }

    if (userId) {
      must.push({ term: { userId } });
    }

    const result = await this.client.search({
      index: `${this.indexPrefix}-posts`,
      body: {
        query: {
          bool: { must },
        },
        from: (page - 1) * limit,
        size: limit,
        sort: [{ createdAt: { order: 'desc' } }],
      },
    } as any);

    return {
      results: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
        score: hit._score,
      })),
      total: result.hits.total || 0,
      page,
      limit,
    };
  }

  async searchComments(query: {
    q?: string;
    postId?: string;
    page?: number;
    limit?: number;
  }) {
    const { q = '', postId, page = 1, limit = 20 } = query;

    const must: any[] = [{ term: { isDeleted: false } }];

    if (q) {
      must.push({
        match: {
          content: {
            query: q,
            operator: 'and',
          },
        },
      });
    }

    if (postId) {
      must.push({ term: { postId } });
    }

    const result = await this.client.search({
      index: `${this.indexPrefix}-comments`,
      body: {
        query: {
          bool: { must },
        },
        from: (page - 1) * limit,
        size: limit,
        sort: [{ createdAt: { order: 'desc' } }],
      },
    } as any);

    return {
      results: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
        score: hit._score,
      })),
      total: result.hits.total || 0,
      page,
      limit,
    };
  }

  async getAutocompleteSuggestions(query: {
    q: string;
    type?: 'restaurants' | 'all';
    limit?: number;
  }) {
    const { q, type = 'all', limit = 5 } = query;

    const indices =
      type === 'restaurants'
        ? [`${this.indexPrefix}-restaurants`]
        : [
            `${this.indexPrefix}-restaurants`,
            `${this.indexPrefix}-posts`,
            `${this.indexPrefix}-comments`,
          ];

    const result = await this.client.search({
      index: indices,
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: q,
                  fields: ['name^5', 'cuisineType^3', 'content'],
                  type: 'phrase_prefix',
                  max_expansions: 10,
                },
              },
            ],
          },
        },
        size: limit,
      },
    } as any);

    return result.hits.hits.map((hit: any) => ({
      id: hit._id,
      type: hit._index.replace(`${this.indexPrefix}-`, ''),
      ...hit._source,
    }));
  }

  async getFeaturedRestaurants(limit = 5) {
    const result = await this.client.search({
      index: `${this.indexPrefix}-restaurants`,
      body: {
        query: {
          bool: {
            must: [
              { term: { verified: true } },
              { term: { active: true } },
            ],
          },
        },
        size: limit,
      },
    } as any);

    return result.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
    }));
  }

  async bulkIndexRestaurants() {
    const restaurantRepository = this.dataSource.getRepository(Restaurant);
    const restaurants = await restaurantRepository.find({ where: { active: true } });

    const operations = restaurants.flatMap((restaurant) => [
      { index: { _index: `${this.indexPrefix}-restaurants`, _id: restaurant.id, document: this.restaurantToDocument(restaurant) } },
    ]);

    if (operations.length > 0) {
      await this.client.bulk({ refresh: true, operations });
      this.logger.log(`Bulk indexed ${operations.length} restaurants`);
    }
  }

  private restaurantToDocument(restaurant: Restaurant) {
    return {
      name: restaurant.name,
      description: restaurant.description || '',
      cuisineType: restaurant.cuisineType,
      priceRange: restaurant.priceRange,
      city: restaurant.address.city,
      state: restaurant.address.state,
      address: `${restaurant.address.street}, ${restaurant.address.city}`,
      amenities: restaurant.amenities,
      verified: restaurant.verified,
      active: restaurant.active,
      location: {
        lat: restaurant.address.latitude || 0,
        lon: restaurant.address.longitude || 0,
      },
      averageRating: 0,
      totalReviews: 0,
    };
  }

  async deleteDocument(index: string, id: string) {
    await this.client.delete({
      index: `${this.indexPrefix}-${index}`,
      id,
    });
  }

  async checkConnection() {
    try {
      const health = await this.client.cluster.health();
      return {
        status: 'ok',
        cluster: health.cluster_name,
        node: health.cluster_name,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
      };
    }
  }
}
