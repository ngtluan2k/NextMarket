import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../modules/user/user.entity';
import { AffiliatePlatform } from '../affiliate-platform/affiliate-platform.entity';

@Entity('affiliate_registration')
export class AffiliateRegistration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User, (user) => user.affiliateRegistrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'char', unique: true })
  uuid!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  phone?: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ManyToMany(() => AffiliatePlatform, (platform) => platform.registrations)
  @JoinTable({
    name: 'affiliate_registration_platforms',
    joinColumn: { name: 'registration_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'platform_id', referencedColumnName: 'id' },
  })
  platforms!: AffiliatePlatform[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
