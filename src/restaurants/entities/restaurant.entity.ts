import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PriceRange {
  BUDGET = 1, // $
  MODERATE = 2, // $$
  EXPENSIVE = 3, // $$$
  LUXURY = 4, // $$$$
}

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  @Index()
  userId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  owner!: User;

  @Column()
  name!: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('simple-array', { default: [] })
  cuisineType!: string[]; // ['Italiana', 'Argentina', 'Parrilla']

  @Column({
    type: 'enum',
    enum: PriceRange,
    default: PriceRange.MODERATE,
  })
  priceRange!: PriceRange;

  @Column('jsonb', { default: {} })
  address!: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };

  @Column('jsonb', { default: [] })
  hours!: OpeningHours[];

  @Column('simple-array', { default: [] })
  amenities!: string[]; // ['WiFi', 'Parking', 'Delivery', 'AC', 'OutdoorSeating']

  @Column({ type: 'int', default: 0 })
  capacity!: number; // Maximum capacity in people

  @Column({ type: 'varchar', length: 20, default: '+598' })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column('simple-array', { default: [] })
  photos!: string[]; // Cloudinary URLs

  @Column({ default: false })
  verified!: boolean; // Admin verified

  @Column({ default: true })
  active!: boolean; // Active/inactive status

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export interface OpeningHours {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  open: string; // HH:mm format
  close: string; // HH:mm format
  closed: boolean;
}
