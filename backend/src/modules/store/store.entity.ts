import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  Generated,
  OneToOne,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { User } from '../user/user.entity';
import { OneToMany } from 'typeorm';
import { Product } from '../product/product.entity';
import { Order } from '../orders/order.entity';
import { StoreInformation } from '../store-information/store-information.entity';
import { StoreIdentification } from '../store-identification/store-identification.entity';
import { StoreLevel } from '../store-level/store-level.entity';
import { StoreAddress } from '../store-address/store-address.entity';
import { StoreBankAccount } from '../store-bank-account/store-bank-account.entity';
import { StoreFollower } from '../store-follower/store-follower.entity';
import { Voucher } from '../vouchers/vouchers.entity';
import { GroupOrder } from '../group_orders/group_orders.entity';
import { CampaignStore } from '../campaigns/entities/campaign_stores.ts.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  user_id!: number;

  @OneToOne(() => User, (user) => user.store)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo_url!: string;

  @Column({ length: 100, nullable: true })
  email!: string;

  @Column({ length: 20, nullable: true })
  phone!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'closed'],
    default: 'inactive',
  })
  status!: 'active' | 'inactive' | 'suspended' | 'closed';

  @Column({ type: 'boolean', default: false })
  is_draft!: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at!: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  avg_rating!: number;

  @Column({ type: 'int', default: 0 })
  review_count!: number;

  @OneToMany(() => Product, (product) => product.store)
  products!: Product[];

  @OneToMany(() => Order, (order) => order.store, { cascade: true })
  orders!: Order;

  // --- New inverse relations for eager loading with "relations"
  @OneToMany(
    () => StoreInformation,
    (StoreInformation) => StoreInformation.store
  )
  storeInformation!: StoreInformation[];

  // --- New inverse relations for eager loading with "relations"

  @OneToMany(
    () => StoreIdentification,
    (StoreIdentification) => StoreIdentification.store
  )
  storeIdentification!: StoreIdentification[];

  @OneToMany(() => StoreLevel, (StoreLevel) => StoreLevel.store)
  storeLevels!: StoreLevel[];

  @OneToMany(() => StoreAddress, (StoreAddress) => StoreAddress.store)
  address!: StoreAddress[];

  @OneToMany(
    () => StoreBankAccount,
    (StoreBankAccount) => StoreBankAccount.store
  )
  bankAccount!: StoreBankAccount[];

  @OneToMany(() => StoreFollower, (StoreFollower) => StoreFollower.store)
  followers!: StoreFollower[];

  @OneToMany(() => Voucher, (Voucher) => Voucher.store)
  vouchers?: Voucher[];
  @OneToMany(() => GroupOrder, (groupOrder) => groupOrder.store)
  group_orders!: GroupOrder[];

  @OneToMany(() => CampaignStore, (cs) => cs.store, {
    cascade: true,
  })
  campaignStores!: CampaignStore[];
}
