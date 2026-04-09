import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DishReviewDocument = DishReview & Document;

@Schema({ timestamps: true, collection: 'dish_reviews' })
export class DishReview {
  @Prop({ type: String, required: true, index: true })
  userId!: string;

  @Prop({ type: String, required: true, index: true })
  postId!: string; // Post del plato que se review

  @Prop({ type: Number, required: true, min: 1, max: 5 })
  rating!: number; // 1-5 stars

  @Prop({ type: Boolean, default: false })
  liked!: boolean; // "Me gustó / No me gustó"

  @Prop({ type: String, trim: true })
  comment!: string;

  @Prop({ type: [String], default: [] })
  photos!: string[];

  @Prop({ type: Number, default: 0 })
  helpfulCount!: number;

  @Prop({ type: Boolean, default: false })
  isDeleted!: boolean;

  @Prop({ type: Date })
  editableUntil?: Date; // Can edit within 7 days

  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  // Validation methods
  canEdit(): boolean {
    if (!this.editableUntil) {
      // Set editable period if not set
      this.editableUntil = new Date(
        this.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
    }
    return new Date() < this.editableUntil;
  }

  addHelpfulVote(): void {
    this.helpfulCount++;
  }

  removeHelpfulVote(): void {
    if (this.helpfulCount > 0) {
      this.helpfulCount--;
    }
  }
}

export const DishReviewSchema = SchemaFactory.createForClass(DishReview);

// Indexes
DishReviewSchema.index({ userId: 1, postId: 1 }, { unique: true }); // One review per user per dish
DishReviewSchema.index({ postId: 1, rating: -1 }); // For sorting by rating
DishReviewSchema.index({ createdAt: -1 }); // For recent reviews
