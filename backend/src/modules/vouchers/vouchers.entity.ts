import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VoucherUsage } from '../voucher-usage/voucher_usage.entity';
import { Store } from '../store/store.entity';
import {VoucherCollection} from '../voucher-collection/voucher-collection.entity';
export enum VoucherType {
  SHIPPING = 0,
  PRODUCT = 1,
  STORE = 2,
  CATEGORY = 3,
  PLATFORM = 4,
}

export enum VoucherDiscountType {
  PERCENTAGE = 0,
  FIXED = 1,
  CASH_BACK = 2,
}

export enum VoucherStatus {
  DRAFT = 0,
  ACTIVE = 1,
  PAUSED = 2,
  EXPIRED = 3,
  DEPLETED = 4,
}

export enum VoucherCollectionType {
  AUTO = 0,
  MANUAL = 1,
  TARGETED = 2,
  EVENT = 3,
}

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  uuid!: string;

  @Column({ unique: true, length: 50 })
  code!: string;

  @Column({ length: 255 })
  title!: string;

  @ManyToOne(() => Store, (store) => store.vouchers, { nullable: true })
  @JoinColumn({ name: 'store_id' })
  store?: Store;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: VoucherType, default: VoucherType.PRODUCT })
  type!: VoucherType;

  @Column({
    type: 'enum',
    enum: VoucherDiscountType,
    default: VoucherDiscountType.PERCENTAGE,
  })
  discount_type!: VoucherDiscountType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  discount_value!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  max_discount_amount?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  min_order_amount!: number;

  @Column({ type: 'timestamp' })
  start_date!: Date;

  @Column({ type: 'timestamp' })
  end_date!: Date;

  @Column({ type: 'int', nullable: true })
  total_usage_limit?: number;

  @Column({ type: 'int', default: 1 })
  per_user_limit!: number;

  @Column({ type: 'int', default: 0 })
  total_used_count!: number;

  @Column({ type: 'int', nullable: true })
  collection_limit?: number;

  @Column({ type: 'int', default: 0 })
  collected_count!: number;

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.ACTIVE })
  status!: VoucherStatus;

  @Column({
    type: 'enum',
    enum: VoucherCollectionType,
    default: VoucherCollectionType.MANUAL,
  })
  collection_type!: VoucherCollectionType;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ type: 'boolean', default: true })
  stackable!: boolean;

  @Column({ type: 'boolean', default: false })
  new_user_only!: boolean;

  @Column({ type: 'json', nullable: true })
  applicable_store_ids?: number[];

  @Column({ type: 'json', nullable: true })
  applicable_category_ids?: number[];

  @Column({ type: 'json', nullable: true })
  applicable_product_ids?: number[];

  @Column({ type: 'json', nullable: true })
  excluded_product_ids?: number[];

  @Column({ type: 'json', nullable: true })
  applicable_user_ids?: number[];

  @Column({ type: 'json', nullable: true })
  user_conditions?: {
    min_orders?: number;
    vip_level?: string[];
    user_tags?: string[];
  };

  @Column({ type: 'json', nullable: true })
  time_restrictions?: {
    days_of_week?: number[];
    hours?: { start: string; end: string }[];
  };

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: '#FF6B6B' })
  theme_color?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => VoucherUsage, (usage) => usage.voucher)
  usages!: VoucherUsage[];

  @OneToMany(() => VoucherCollection, (collection) => collection.voucher)
  collections!: VoucherCollection[];
}
