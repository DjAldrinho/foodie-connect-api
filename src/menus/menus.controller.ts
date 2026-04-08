import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/types/request.types';

@ApiTags('menus')
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update menu for restaurant' })
  @ApiResponse({ status: 201, description: 'Menu created successfully' })
  async create(
    @Request() req: AuthenticatedRequest,
    @Body('restaurantId') restaurantId: string,
    @Body() createMenuDto: CreateMenuDto,
  ) {
    return this.menusService.create(restaurantId, createMenuDto);
  }

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get menu by restaurant ID' })
  @ApiResponse({ status: 200, description: 'Menu retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async findByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.menusService.findByRestaurant(restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get menu by ID' })
  @ApiResponse({ status: 200, description: 'Menu retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update menu' })
  @ApiResponse({ status: 200, description: 'Menu updated successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menusService.update(id, updateMenuDto);
  }

  @Post(':id/categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add category to menu' })
  @ApiResponse({ status: 200, description: 'Category added successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async addCategory(
    @Param('id') id: string,
    @Body('name') categoryName: string,
  ) {
    return this.menusService.addCategory(id, categoryName);
  }

  @Patch(':id/categories/:categoryName')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove category from menu' })
  @ApiResponse({ status: 200, description: 'Category removed successfully' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async removeCategory(
    @Param('id') id: string,
    @Param('categoryName') categoryName: string,
  ) {
    return this.menusService.removeCategory(id, categoryName);
  }

  @Post(':id/categories/:categoryName/items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to menu category' })
  @ApiResponse({ status: 200, description: 'Item added successfully' })
  @ApiResponse({ status: 404, description: 'Menu or category not found' })
  async addItem(
    @Param('id') id: string,
    @Param('categoryName') categoryName: string,
    @Body() item: any,
  ) {
    return this.menusService.addItem(id, categoryName, item);
  }

  @Patch(':id/categories/:categoryName/items/:itemName')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from menu category' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
  @ApiResponse({ status: 404, description: 'Menu, category or item not found' })
  async removeItem(
    @Param('id') id: string,
    @Param('categoryName') categoryName: string,
    @Param('itemName') itemName: string,
  ) {
    return this.menusService.removeItem(id, categoryName, itemName);
  }

  @Patch(':id/categories/:categoryName/items/:itemName/availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update item availability' })
  @ApiResponse({ status: 200, description: 'Item availability updated' })
  @ApiResponse({ status: 404, description: 'Menu, category or item not found' })
  async updateItemAvailability(
    @Param('id') id: string,
    @Param('categoryName') categoryName: string,
    @Param('itemName') itemName: string,
    @Body('available') available: boolean,
  ) {
    return this.menusService.updateItemAvailability(
      id,
      categoryName,
      itemName,
      available,
    );
  }
}
