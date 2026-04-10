import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { User } from '../../users/entities/user.entity';

@Entity('restaurant_reviews')
export class RestaurantReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  @Index()
  userId!: string;

  @Column({ name: 'restaurant_id' })
  @Index()
  restaurantId!: string;

  @Column({ type: 'integer' })
  @Index()
  rating!: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'visit_date', type: 'date', nullable: true })
  @Index()
  visitDate!: Date | null;

  @Column({ type: 'text', array: true, default: [] })
  photos!: string[];

  @Column({ name: 'verified_visit', type: 'boolean', default: false })
  verifiedVisit!: boolean;

  @Column({ name: 'helpful_count', type: 'integer', default: 0 })
  helpfulCount!: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  @Index()
  isDeleted!: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Validation methods
  canEdit(): boolean {
    const daysSinceCreation = Math.floor(
      (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysSinceCreation < 7;
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
