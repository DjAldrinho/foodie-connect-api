import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Post {
  @ApiProperty({ example: 'user-123' })
  @Prop({ required: true })
  userId!: string;

  @ApiProperty({ example: 'Delicious pasta recipe' })
  @Prop({ required: true })
  title!: string;

  @ApiProperty({ example: 'Step by step pasta recipe', required: false })
  @Prop()
  description?: string;

  @ApiProperty({ example: ['https://example.com/pasta.jpg'], required: false })
  @Prop({ type: [String], default: [] })
  imageUrls!: string[];

  @ApiProperty({ example: 'Restaurant name', required: false })
  @Prop()
  location?: string;

  @ApiProperty({ example: 0, required: false })
  @Prop({ default: 0 })
  likesCount!: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @Prop({ required: true })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @Prop({ required: true })
  updatedAt!: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
