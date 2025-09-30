import {
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Store } from '../store/store.entity';
import { UserAddress } from '../user_address/user_address.entity';
import { OrderItem } from '../order-items/order-item.entity';
import {  OrderStatusHistory } from '../order-status-history/order-status-history.entity';
import { OrderInvoice } from '../order-invoices/order-invoice.entity';
import { VoucherUsage } from '../voucher-usage/voucher_usage.entity';
import { Payment } from '../payments/payment.entity';
import { Refund } from '../refunds/refund.entity';

export enum OrderStatuses {
  Pending = 0,
  Confirmed = 1,
  Processing = 2,
  Shipped = 3,
  Delivered = 4,
  Completed = 5,
  Cancelled = 6,
  Returned = 7,
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => User, (user) => user.orders, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Store, (store) => store.orders, { nullable: false })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @ManyToOne(() => UserAddress, (userAddress) => userAddress.orders, {
    nullable: false,
  })
  @JoinColumn({ name: 'address_id' })
  userAddress!: UserAddress;

  @Column({
    type: 'tinyint',
    default: OrderStatuses.Pending,
  })
  status!: OrderStatuses;

  @Column({
    name: 'sub_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  subtotal?: number;

  @Column({
    name: 'shipping_fee',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  shippingFee?: number;

  @Column({
    name: 'discount_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  discountTotal?: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalAmount?: number;

  @Column({ type: 'char', length: 3, default: 'VND' })
  currency!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (orderitem) => orderitem.order)
  orderItem!: OrderItem[];
  
  @OneToMany(() => OrderStatusHistory, (history) => history.order)
  orderStatusHistory!: OrderStatusHistory[];

  @OneToMany(() =>OrderInvoice,(invoice)=> invoice.order )
  orderInvoice!: OrderInvoice[];

  @OneToMany(() => VoucherUsage, (usage) => usage.order)
  voucherUsages!: VoucherUsage[];
  
  @OneToMany(() => Payment, (payment) => payment.order)
  payment!: Payment[];

  @OneToMany(() => Refund, (refund) => refund.order)
  refund!: Refund[];
}
