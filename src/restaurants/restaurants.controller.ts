import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PriceRange } from './entities/restaurant.entity';
import type { AuthenticatedRequest } from '../common/types/request.types';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a restaurant profile' })
  @ApiResponse({ status: 201, description: 'Restaurant created successfully' })
  @ApiResponse({ status: 400, description: 'User already has a restaurant' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() createRestaurantDto: CreateRestaurantDto,
  ) {
    return this.restaurantsService.create(req.user.userId, createRestaurantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all restaurants with filters' })
  @ApiResponse({
    status: 200,
    description: 'Restaurants retrieved successfully',
  })
  async findAll(
    @Query('cuisineType') cuisineType?: string,
    @Query('priceRange') priceRange?: PriceRange,
    @Query('city') city?: string,
    @Query('verified') verified?: string,
  ) {
    const filters: any = {};

    if (cuisineType) filters.cuisineType = cuisineType;
    if (priceRange !== undefined) filters.priceRange = priceRange;
    if (city) filters.city = city;
    if (verified !== undefined) filters.verified = verified === 'true';

    return this.restaurantsService.findAll(filters);
  }

  @Get('my-restaurant')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user restaurant' })
  @ApiResponse({
    status: 200,
    description: 'Restaurant retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async findMyRestaurant(@Request() req: AuthenticatedRequest) {
    return this.restaurantsService.findByOwner(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Restaurant retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update restaurant information' })
  @ApiResponse({ status: 200, description: 'Restaurant updated successfully' })
  @ApiResponse({ status: 403, description: 'Not your restaurant' })
  async update(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(
      id,
      req.user.userId,
      updateRestaurantDto,
    );
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify restaurant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Restaurant verified successfully' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async verifyRestaurant(@Param('id') id: string) {
    return this.restaurantsService.verifyRestaurant(id);
  }

  @Patch(':id/photos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add photo to restaurant gallery' })
  @ApiResponse({ status: 200, description: 'Photo added successfully' })
  @ApiResponse({ status: 403, description: 'Not your restaurant' })
  async addPhoto(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body('photoUrl') photoUrl: string,
  ) {
    return this.restaurantsService.addPhoto(id, req.user.userId, photoUrl);
  }

  @Delete(':id/photos/:photoUrl')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove photo from restaurant gallery' })
  @ApiResponse({ status: 200, description: 'Photo removed successfully' })
  @ApiResponse({ status: 403, description: 'Not your restaurant' })
  async removePhoto(
    @Param('id') id: string,
    @Param('photoUrl') photoUrl: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.restaurantsService.removePhoto(
      id,
      req.user.userId,
      decodeURIComponent(photoUrl),
    );
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate restaurant (soft delete)' })
  @ApiResponse({ status: 200, description: 'Restaurant deactivated' })
  @ApiResponse({ status: 403, description: 'Not your restaurant' })
  async deactivate(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.restaurantsService.deactivate(id, req.user.userId);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate restaurant' })
  @ApiResponse({ status: 200, description: 'Restaurant activated' })
  @ApiResponse({ status: 403, description: 'Not your restaurant' })
  async activate(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.restaurantsService.activate(id, req.user.userId);
  }
}
