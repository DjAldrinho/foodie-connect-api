import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchRestaurantsDto,
  SearchPostsDto,
  SearchCommentsDto,
  AutocompleteDto,
} from './dto/search.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/request.types';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('restaurants')
  @ApiOperation({ summary: 'Search restaurants with advanced filters' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchRestaurants(@Query() query: SearchRestaurantsDto) {
    return this.searchService.searchRestaurants(query);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Search posts by content' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchPosts(@Query() query: SearchPostsDto) {
    return this.searchService.searchPosts(query);
  }

  @Get('comments')
  @ApiOperation({ summary: 'Search comments by content' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchComments(@Query() query: SearchCommentsDto) {
    return this.searchService.searchComments(query);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions' })
  async getAutocompleteSuggestions(@Query() query: AutocompleteDto) {
    return this.searchService.getAutocompleteSuggestions(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured/sponsored restaurants' })
  @ApiResponse({ status: 200, description: 'Featured restaurants' })
  async getFeaturedRestaurants(
    @Query('limit') limit?: number,
  ) {
    return this.searchService.getFeaturedRestaurants(limit);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check Elasticsearch connection' })
  @ApiResponse({ status: 200, description: 'Connection status' })
  async checkConnection() {
    return this.searchService.checkConnection();
  }

  @Post('index/restaurants')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bulk index all restaurants (admin)' })
  @ApiResponse({ status: 200, description: 'Indexed restaurants count' })
  async bulkIndexRestaurants() {
    return this.searchService.bulkIndexRestaurants();
  }
}
