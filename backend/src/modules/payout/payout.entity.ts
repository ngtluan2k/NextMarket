import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Store } from './../store/store.entity';

@Entity('payouts')
export class Payout {
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

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  status!: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requested_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at!: Date;
}
