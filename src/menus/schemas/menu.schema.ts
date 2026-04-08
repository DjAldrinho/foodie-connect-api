import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MenuDocument = Menu & Document;

@Schema({
  timestamps: true,
  collection: 'menus',
})
export class Menu {
  @Prop({ required: true })
  restaurantId!: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        items: [
          {
            name: { type: String, required: true },
            description: { type: String, required: false },
            price: { type: Number, required: true },
            photos: [String],
            available: { type: Boolean, default: true },
            allergens: [String], // ['Gluten', 'Lácteos', 'Nueces']
            tags: [String], // ['Vegetariano', 'Vegano', 'Sin TACC']
          },
        ],
      },
    ],
    required: true,
    default: [],
  })
  categories!: MenuCategory[];

  @Prop({ default: true })
  active!: boolean;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface MenuItem {
  name: string;
  description?: string;
  price: number;
  photos: string[];
  available: boolean;
  allergens: string[];
  tags: string[];
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

// Index for faster lookups by restaurant
MenuSchema.index({ restaurantId: 1 });
