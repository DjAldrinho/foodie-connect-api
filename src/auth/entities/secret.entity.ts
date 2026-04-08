import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('jwt_secrets')
export class Secret {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  secret!: string;

  @Column({ default: 1 })
  version!: number;

  @Column({ default: true })
  active?: boolean;

  @Column({ name: 'expires_at', nullable: true })
  expires_at?: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;
}
