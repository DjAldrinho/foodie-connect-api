import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

describe('SearchController', () => {
  let controller: SearchController;
  let service: jest.Mocked<SearchService>;

  const mockSearchResults = {
    results: [
      {
        id: '1',
        name: 'Test Restaurant',
        description: 'Amazing food',
        score: 2.5,
      },
    ],
    total: 10,
    page: 1,
    limit: 20,
  };

  const mockAutocompleteResults = [
    {
      id: '1',
      type: 'restaurants',
      name: 'Test Restaurant',
      cuisineType: 'Italiana',
    },
  ];

  const mockFeaturedRestaurants = [
    {
      id: '1',
      name: 'Featured Restaurant',
      verified: true,
      active: true,
    },
  ];

  beforeEach(async () => {
    const mockSearchService = {
      searchRestaurants: jest.fn().mockResolvedValue(mockSearchResults),
      searchPosts: jest.fn().mockResolvedValue(mockSearchResults),
      searchComments: jest.fn().mockResolvedValue(mockSearchResults),
      getAutocompleteSuggestions: jest
        .fn()
        .mockResolvedValue(mockAutocompleteResults),
      getFeaturedRestaurants: jest
        .fn()
        .mockResolvedValue(mockFeaturedRestaurants),
      checkConnection: jest.fn().mockResolvedValue({
        status: 'ok',
        cluster: 'test-cluster',
      }),
      bulkIndexRestaurants: jest.fn().mockResolvedValue({
        indexed: 10,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SearchController>(SearchController);
    service = module.get(SearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchRestaurants', () => {
    it('should search restaurants with query', async () => {
      const query = {
        q: 'pasta',
        cuisineType: 'Italiana',
        city: 'Montevideo',
        priceRange: 2,
        verified: true,
        page: 1,
        limit: 20,
      };

      const result = await controller.searchRestaurants(query);

      expect(service.searchRestaurants).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockSearchResults);
    });

    it('should search with geo-location filters', async () => {
      const query = {
        lat: -34.9011,
        lon: -56.1645,
        distance: 10,
      };

      await controller.searchRestaurants(query);

      expect(service.searchRestaurants).toHaveBeenCalledWith(query);
    });

    it('should search with minimal parameters', async () => {
      const query = {};

      await controller.searchRestaurants(query);

      expect(service.searchRestaurants).toHaveBeenCalledWith(query);
    });
  });

  describe('searchPosts', () => {
    it('should search posts with query', async () => {
      const query = {
        q: 'amazing food',
        userId: 'user123',
        page: 1,
        limit: 20,
      };

      const result = await controller.searchPosts(query);

      expect(service.searchPosts).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockSearchResults);
    });

    it('should search posts without filters', async () => {
      const query = {};

      await controller.searchPosts(query);

      expect(service.searchPosts).toHaveBeenCalledWith(query);
    });
  });

  describe('searchComments', () => {
    it('should search comments with query', async () => {
      const query = {
        q: 'great place',
        postId: 'post123',
        page: 1,
        limit: 20,
      };

      const result = await controller.searchComments(query);

      expect(service.searchComments).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockSearchResults);
    });

    it('should search comments without filters', async () => {
      const query = {};

      await controller.searchComments(query);

      expect(service.searchComments).toHaveBeenCalledWith(query);
    });
  });

  describe('getAutocompleteSuggestions', () => {
    it('should get autocomplete suggestions for all types', async () => {
      const query = {
        q: 'ita',
        type: 'all' as const,
        limit: 5,
      };

      const result = await controller.getAutocompleteSuggestions(query);

      expect(service.getAutocompleteSuggestions).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockAutocompleteResults);
    });

    it('should get autocomplete suggestions for restaurants only', async () => {
      const query = {
        q: 'pas',
        type: 'restaurants' as const,
        limit: 10,
      };

      await controller.getAutocompleteSuggestions(query);

      expect(service.getAutocompleteSuggestions).toHaveBeenCalledWith(query);
    });

    it('should use default limit when not provided', async () => {
      const query = {
        q: 'test',
      };

      await controller.getAutocompleteSuggestions(query);

      expect(service.getAutocompleteSuggestions).toHaveBeenCalledWith(query);
    });
  });

  describe('getFeaturedRestaurants', () => {
    it('should get featured restaurants with custom limit', async () => {
      const result = await controller.getFeaturedRestaurants(10);

      expect(service.getFeaturedRestaurants).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockFeaturedRestaurants);
    });

    it('should get featured restaurants with default limit', async () => {
      await controller.getFeaturedRestaurants();

      expect(service.getFeaturedRestaurants).toHaveBeenCalledWith(undefined);
    });
  });

  describe('checkConnection', () => {
    it('should return connection status', async () => {
      const result = await controller.checkConnection();

      expect(service.checkConnection).toHaveBeenCalled();
      expect(result).toEqual({
        status: 'ok',
        cluster: 'test-cluster',
      });
    });
  });

  describe('bulkIndexRestaurants', () => {
    it('should bulk index all restaurants', async () => {
      const result = await controller.bulkIndexRestaurants();

      expect(service.bulkIndexRestaurants).toHaveBeenCalled();
      expect(result).toEqual({
        indexed: 10,
      });
    });
  });
});
