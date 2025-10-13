import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Store } from './../store/store.entity';
import { User } from './../user/user.entity';

@Entity('store_upgrade_requests')
export class StoreUpgradeRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  store_id!: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({
    type: 'enum',
    enum: ['trusted', 'premium'],
  })
  requested_level!: 'trusted' | 'premium';

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status!: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true })
  note!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at!: Date;

  @Column({ nullable: true })
  reviewed_by!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer!: User;
}
