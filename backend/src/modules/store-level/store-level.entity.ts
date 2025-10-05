import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from './../store/store.entity';

@Entity('store_levels')
export class StoreLevel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  store_id!: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({
    type: 'enum',
    enum: ['basic', 'trusted', 'premium'],
    default: 'basic',
  })
  level!: 'basic' | 'trusted' | 'premium';

  @Column({ type: 'datetime', nullable: true })
  upgraded_at!: Date;
}
