import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Menu, MenuDocument } from './schemas/menu.schema';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenusService {
  constructor(
    @InjectModel('Menu')
    private menuModel: Model<MenuDocument>,
  ) {}

  async create(
    restaurantId: string,
    createMenuDto: CreateMenuDto,
  ): Promise<Menu> {
    // Check if menu already exists for this restaurant
    const existingMenu = await this.menuModel.findOne({ restaurantId });

    if (existingMenu) {
      // Update existing menu
      existingMenu.categories = createMenuDto.categories as any;
      return existingMenu.save();
    }

    const menu = await this.menuModel.create({
      restaurantId,
      ...createMenuDto,
    });

    return menu.save();
  }

  async findByRestaurant(restaurantId: string): Promise<Menu> {
    const menu = await this.menuModel.findOne({ restaurantId });

    if (!menu) {
      throw new NotFoundException('Menu not found for this restaurant');
    }

    return menu;
  }

  async findOne(id: string): Promise<Menu> {
    const menu = await this.menuModel.findById(id);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu;
  }

  async update(id: string, updateMenuDto: UpdateMenuDto): Promise<Menu> {
    const menu = await this.menuModel.findById(id);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    if (updateMenuDto.categories) {
      menu.categories = updateMenuDto.categories as any;
    }

    return menu.save();
  }

  async addCategory(menuId: string, categoryName: string): Promise<Menu> {
    const menu = await this.menuModel.findById(menuId);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    const categoryExists = menu.categories.some(
      (cat: any) => cat.name === categoryName,
    );

    if (categoryExists) {
      throw new ForbiddenException('Category already exists');
    }

    menu.categories.push({
      name: categoryName,
      items: [],
    } as any);

    return menu.save();
  }

  async removeCategory(menuId: string, categoryName: string): Promise<Menu> {
    const menu = await this.menuModel.findById(menuId);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    menu.categories = menu.categories.filter(
      (cat: any) => cat.name !== categoryName,
    );

    return menu.save();
  }

  async addItem(
    menuId: string,
    categoryName: string,
    item: any,
  ): Promise<Menu> {
    const menu = await this.menuModel.findById(menuId);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    const category = menu.categories.find(
      (cat: any) => cat.name === categoryName,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    (category as any).items.push(item);

    return menu.save();
  }

  async removeItem(
    menuId: string,
    categoryName: string,
    itemName: string,
  ): Promise<Menu> {
    const menu = await this.menuModel.findById(menuId);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    const category = menu.categories.find(
      (cat: any) => cat.name === categoryName,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    (category as any).items = (category as any).items.filter(
      (item: any) => item.name !== itemName,
    );

    return menu.save();
  }

  async updateItemAvailability(
    menuId: string,
    categoryName: string,
    itemName: string,
    available: boolean,
  ): Promise<Menu> {
    const menu = await this.menuModel.findById(menuId);

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    const category = menu.categories.find(
      (cat: any) => cat.name === categoryName,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const item = (category as any).items.find(
      (item: any) => item.name === itemName,
    );

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    item.available = available;

    return menu.save();
  }
}
