import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  Generated,
  OneToOne,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../user/user.entity';
import { OneToMany } from 'typeorm';
import { Product } from '../product/product.entity';
import { Order } from '../orders/order.entity';
import { StoreRating } from '../store-rating/store-rating.entity';
import { StoreInformation } from '../store-information/store-information.entity';
import { StoreIdentification } from '../store-identification/store-identification.entity';
import { StoreLevel } from '../store-level/store-level.entity';
import { StoreAddress } from '../store-address/store-address.entity';
import { StoreFollower } from '../store-follower/store-follower.entity';
import { StoreBankAccount } from '../store-bank-account/store-bank-account.entity';
import { Voucher } from '../vouchers/vouchers.entity';
@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
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

  @Column({ type: 'varchar', length: 255, })
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

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP'})
  created_at!: Date;

  @Column({ type: 'datetime',  default: () => 'CURRENT_TIMESTAMP',  onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @OneToMany(() => Product, (product) => product.store)
  products!: Product[]; // <-- thêm dòng này

  @OneToMany(() => Order,(order) => order.store, {cascade: true})
  orders!:Order[];

  @OneToMany(() => StoreInformation, (StoreInformation) => StoreInformation.store)
  storeInformation !: StoreInformation[];

  @OneToMany(() => StoreIdentification, (StoreIdentification) => StoreIdentification.store)
  storeIdentification !: StoreIdentification[];

  @OneToMany(() => StoreLevel, (StoreLevel) => StoreLevel.store)
  storeLevel !: StoreLevel[];

  @OneToMany(() => StoreAddress, (StoreAddress) => StoreAddress.store)
  address !: StoreAddress[];

  @OneToMany(() => StoreBankAccount, (StoreBankAccount) => StoreBankAccount.store)
  bankAccount !: StoreBankAccount[];

  @OneToMany(() => StoreFollower, (StoreFollower) => StoreFollower.store)
  follower !: StoreFollower[];

  @OneToMany(() => StoreRating, (StoreRating) => StoreRating.store)
  rating !: StoreRating[];

  @OneToMany(() => Voucher, (voucher) => voucher.store)
  vouchers!: Voucher[];
}
