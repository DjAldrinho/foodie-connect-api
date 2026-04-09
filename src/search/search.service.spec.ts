import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { DataSource } from 'typeorm';
import { Client } from '@elastic/elasticsearch';

// Mock Elasticsearch Client
jest.mock('@elastic/elasticsearch');

describe('SearchService', () => {
  let service: SearchService;
  let mockClient: jest.Mocked<Client>;
  let mockDataSource: jest.Mocked<DataSource>;

  const mockRestaurant = {
    id: '1',
    name: 'Test Restaurant',
    description: 'Amazing food',
    cuisineType: 'Italiana',
    priceRange: 2,
    address: {
      street: 'Main St 123',
      city: 'Montevideo',
      state: 'Montevideo',
      latitude: -34.9011,
      longitude: -56.1645,
    },
    amenities: ['WiFi', 'Parking'],
    verified: true,
    active: true,
  };

  const mockElasticsearchResponse = {
    hits: {
      total: { value: 10 },
      hits: [
        {
          _id: '1',
          _index: 'foodie-connect-restaurants',
          _score: 2.5,
          _source: {
            name: 'Test Restaurant',
            description: 'Amazing food',
            cuisineType: 'Italiana',
            priceRange: 2,
            city: 'Montevideo',
          },
        },
      ],
    },
  };

  beforeEach(async () => {
    // Mock DataSource
    mockDataSource = {
      getRepository: jest.fn(),
    } as any;

    // Mock Elasticsearch Client
    mockClient = {
      indices: {
        exists: jest.fn().mockResolvedValue(false),
        create: jest.fn().mockResolvedValue(true),
      },
      search: jest.fn().mockResolvedValue(mockElasticsearchResponse),
      index: jest.fn().mockResolvedValue({}),
      bulk: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      cluster: {
        health: jest.fn().mockResolvedValue({
          cluster_name: 'test-cluster',
        }),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(Restaurant),
          useValue: {
            find: jest.fn().mockResolvedValue([mockRestaurant]),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);

    // Replace the client with mock
    (service as any).client = mockClient;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create indices on module init', async () => {
      await service.onModuleInit();

      expect(mockClient.indices.exists).toHaveBeenCalledTimes(3);
      expect(mockClient.indices.create).toHaveBeenCalledTimes(3);
    });

    it('should not create indices if they already exist', async () => {
      mockClient.indices.exists = jest.fn().mockResolvedValue(true);

      await service.onModuleInit();

      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });
  });

  describe('indexRestaurant', () => {
    it('should index a restaurant document', async () => {
      await service.indexRestaurant(mockRestaurant);

      expect(mockClient.index).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        id: mockRestaurant.id,
        body: expect.objectContaining({
          name: mockRestaurant.name,
          cuisineType: mockRestaurant.cuisineType,
          priceRange: mockRestaurant.priceRange,
        }),
      });
    });

    it('should handle missing latitude/longitude', async () => {
      const restaurantWithoutCoords = {
        ...mockRestaurant,
        address: {
          ...mockRestaurant.address,
          latitude: undefined,
          longitude: undefined,
        },
      };

      await service.indexRestaurant(restaurantWithoutCoords);

      expect(mockClient.index).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        id: mockRestaurant.id,
        body: expect.objectContaining({
          location: { lat: 0, lon: 0 },
        }),
      });
    });
  });

  describe('searchRestaurants', () => {
    it('should search restaurants with text query', async () => {
      const result = await service.searchRestaurants({
        q: 'pasta',
        page: 1,
        limit: 20,
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  multi_match: expect.objectContaining({
                    query: 'pasta',
                    fields: ['name^3', 'description', 'address'],
                  }),
                }),
              ]),
            }),
          }),
        }),
      } as any);

      expect(result.results).toHaveLength(1);
      expect(result.total).toBe(10);
    });

    it('should filter by cuisine type', async () => {
      await service.searchRestaurants({
        cuisineType: 'Italiana',
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { cuisineType: 'Italiana' } },
              ]),
            }),
          }),
        }),
      } as any);
    });

    it('should filter by city', async () => {
      await service.searchRestaurants({
        city: 'Montevideo',
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { city: 'Montevideo' } },
              ]),
            }),
          }),
        }),
      } as any);
    });

    it('should filter by price range', async () => {
      await service.searchRestaurants({
        priceRange: 2,
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { priceRange: 2 } },
              ]),
            }),
          }),
        }),
      } as any);
    });

    it('should filter by verified status', async () => {
      await service.searchRestaurants({
        verified: true,
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { verified: true } },
              ]),
            }),
          }),
        }),
      } as any);
    });

    it('should apply geo-distance filter when lat/lon provided', async () => {
      await service.searchRestaurants({
        lat: -34.9011,
        lon: -56.1645,
        distance: 10,
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  geo_distance: expect.objectContaining({
                    distance: '10km',
                    location: { lat: -34.9011, lon: -56.1645 },
                  }),
                }),
              ]),
            }),
          }),
          sort: expect.arrayContaining([
            expect.objectContaining({
              _geo_distance: expect.objectContaining({
                unit: 'km',
                location: { lat: -34.9011, lon: -56.1645 },
              }),
            }),
          ]),
        }),
      } as any);
    });

    it('should paginate results correctly', async () => {
      await service.searchRestaurants({
        page: 2,
        limit: 10,
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        body: expect.objectContaining({
          from: 10,
          size: 10,
        }),
      } as any);
    });
  });

  describe('searchPosts', () => {
    it('should search posts with text query', async () => {
      await service.searchPosts({
        q: 'amazing food',
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-posts',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                { term: { isDeleted: false } },
                expect.objectContaining({
                  multi_match: expect.objectContaining({
                    query: 'amazing food',
                    fields: ['content^2', 'location'],
                  }),
                }),
              ]),
            }),
          }),
        }),
      } as any);
    });

    it('should filter by user ID', async () => {
      await service.searchPosts({
        userId: 'user123',
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-posts',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                { term: { isDeleted: false } },
                { term: { userId: 'user123' } },
              ]),
            }),
          }),
        }),
      } as any);
    });

    it('should sort by creation date', async () => {
      await service.searchPosts({});

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-posts',
        body: expect.objectContaining({
          sort: [{ createdAt: { order: 'desc' } }],
        }),
      } as any);
    });
  });

  describe('searchComments', () => {
    it('should search comments with text query', async () => {
      await service.searchComments({
        q: 'great place',
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-comments',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                { term: { isDeleted: false } },
                expect.objectContaining({
                  match: expect.objectContaining({
                    content: expect.objectContaining({
                      query: 'great place',
                      operator: 'and',
                    }),
                  }),
                }),
              ]),
            }),
          }),
        }),
      } as any);
    });

    it('should filter by post ID', async () => {
      await service.searchComments({
        postId: 'post123',
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-comments',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                { term: { isDeleted: false } },
                { term: { postId: 'post123' } },
              ]),
            }),
          }),
        }),
      } as any);
    });
  });

  describe('getAutocompleteSuggestions', () => {
    beforeEach(() => {
      // Override search mock for autocomplete tests
      mockClient.search = jest.fn().mockResolvedValue({
        hits: {
          total: { value: 3 },
          hits: [
            {
              _id: '1',
              _index: 'foodie-connect-restaurants',
              _source: {
                name: 'Pasta House',
                cuisineType: 'Italiana',
              },
            },
            {
              _id: '2',
              _index: 'foodie-connect-posts',
              _source: {
                content: 'Amazing pasta dish',
              },
            },
            {
              _id: '3',
              _index: 'foodie-connect-comments',
              _source: {
                content: 'Best pasta ever',
              },
            },
          ],
        },
      });
    });

    it('should get suggestions for all indices by default', async () => {
      await service.getAutocompleteSuggestions({
        q: 'pas',
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: [
          'foodie-connect-restaurants',
          'foodie-connect-posts',
          'foodie-connect-comments',
        ],
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              should: expect.arrayContaining([
                expect.objectContaining({
                  multi_match: expect.objectContaining({
                    query: 'pas',
                    fields: ['name^5', 'cuisineType^3', 'content'],
                    type: 'phrase_prefix',
                  }),
                }),
              ]),
            }),
          }),
          size: 5,
        }),
      } as any);
    });

    it('should search only restaurants when type is restaurants', async () => {
      await service.getAutocompleteSuggestions({
        q: 'ita',
        type: 'restaurants',
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: ['foodie-connect-restaurants'],
        body: expect.any(Object),
      } as any);
    });

    it('should limit suggestions', async () => {
      await service.getAutocompleteSuggestions({
        q: 'test',
        limit: 10,
      });

      expect(mockClient.search).toHaveBeenCalledWith({
        index: expect.any(Array),
        body: expect.objectContaining({
          size: 10,
        }),
      } as any);
    });
  });

  describe('getFeaturedRestaurants', () => {
    it('should get verified and active restaurants', async () => {
      await service.getFeaturedRestaurants(5);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                { term: { verified: true } },
                { term: { active: true } },
              ]),
            }),
          }),
          size: 5,
        }),
      } as any);
    });

    it('should use default limit of 5', async () => {
      await service.getFeaturedRestaurants();

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        body: expect.objectContaining({
          size: 5,
        }),
      } as any);
    });
  });

  describe('bulkIndexRestaurants', () => {
    it('should bulk index all active restaurants', async () => {
      const mockRepository = {
        find: jest.fn().mockResolvedValue([mockRestaurant]),
      };

      mockDataSource.getRepository = jest.fn().mockReturnValue(mockRepository);

      await service.bulkIndexRestaurants();

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(Restaurant);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { active: true },
      });
      expect(mockClient.bulk).toHaveBeenCalled();
    });
  });

  describe('deleteDocument', () => {
    it('should delete document from index', async () => {
      await service.deleteDocument('restaurants', 'doc123');

      expect(mockClient.delete).toHaveBeenCalledWith({
        index: 'foodie-connect-restaurants',
        id: 'doc123',
      });
    });
  });

  describe('checkConnection', () => {
    it('should return connection status when healthy', async () => {
      const result = await service.checkConnection();

      expect(result).toEqual({
        status: 'ok',
        cluster: 'test-cluster',
        node: 'test-cluster',
      });
    });

    it('should return error status when connection fails', async () => {
      mockClient.cluster.health = jest.fn().mockRejectedValue(
        new Error('Connection failed'),
      );

      const result = await service.checkConnection();

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });
  });
});
