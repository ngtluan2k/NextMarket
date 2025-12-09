import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Store } from './../store/store.entity';

@Entity('store_addresses')
export class StoreAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  stores_id!: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'stores_id' })
  store!: Store;

  @Column({ length: 255 })
  recipient_name!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ type: 'text' })
  street!: string;

  @Column({ length: 100, nullable: true })
  district!: string;

  @Column({ length: 100 })
  province!: string;

  @Column({ length: 100, nullable: true })
  ward!: string;

  @Column({ length: 100 })
  country!: string;

  @Column({ length: 20 })
  postal_code!: string;

  @Column({ length: 50 })
  type!: string;

  @Column({ length: 500, nullable: true })
  detail!: string;

  @Column({ type: 'boolean', default: false })
  is_default!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ name: 'ghn_province_id', nullable: true })
  ghn_province_id?: number;

  @Column({ name: 'ghn_district_id', nullable: true })
  ghn_district_id?: number;

  @Column({ name: 'ghn_ward_code', nullable: true, length: 20 })
  ghn_ward_code?: string;
}
