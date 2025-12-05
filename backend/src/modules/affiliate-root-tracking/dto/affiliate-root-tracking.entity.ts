// ==================== ENTITY ====================
// affiliate-root-tracking.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/user.entity';
@Entity('affiliate_root_tracking')
export class AffiliateRootTracking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'uuid', default: () => 'gen_random_uuid()', unique: true })
  uuid!: string;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}