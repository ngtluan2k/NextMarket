import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Store } from './../store/store.entity';
import { StoreLevelEnum } from './store-level.enum';

@Entity('store_levels')
@Unique(['store_id'])
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
  level!: StoreLevelEnum;

  @Column({ type: 'timestamp', nullable: true })
  upgraded_at!: Date;
}
