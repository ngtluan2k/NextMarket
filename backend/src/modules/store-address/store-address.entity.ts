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

  @Column({ type: 'char', length: 36, unique: true })
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

  @Column({ length: 100 })
  city!: string;

  @Column({ length: 100 })
  province!: string;

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

  @Column({ type: 'boolean', default: false })
  is_draft!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
