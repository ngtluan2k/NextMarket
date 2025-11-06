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
import { OrderStatusHistory } from '../order-status-history/order-status-history.entity';
import { OrderInvoice } from '../order-invoices/order-invoice.entity';
import { VoucherUsage } from '../voucher-usage/voucher_usage.entity';
import { Payment } from '../payments/payment.entity';
import { Refund } from '../refunds/refund.entity';
import { ProductReview } from '../product_reviews/product_review.entity';
import { OrderStatuses } from './types/orders';
import { GroupOrder } from '../group_orders/group_orders.entity';
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
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
    type: 'integer',
    default: OrderStatuses.pending,
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (orderitem) => orderitem.order)
  orderItem!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order)
  orderStatusHistory!: OrderStatusHistory[];

  @OneToMany(() => OrderInvoice, (invoice) => invoice.order)
  orderInvoice!: OrderInvoice[];

  @OneToMany(() => VoucherUsage, (usage) => usage.order)
  voucherUsages!: VoucherUsage[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payment!: Payment[];

  @OneToMany(() => Refund, (refund) => refund.order)
  refund!: Refund[];

  @OneToMany(() => ProductReview, (reviews) => reviews.order)
  reviews!: ProductReview;

  @ManyToOne(() => GroupOrder, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'group_order_id' })
  group_order!: GroupOrder | null;

  @Column({ name: 'group_order_id', nullable: true })
  group_order_id?: number;

  // Affiliate tracking fields
  @Column({ name: 'affiliate_user_id', nullable: true })
  affiliate_user_id?: number;

  @Column({ name: 'affiliate_code', length: 50, nullable: true })
  affiliate_code?: string;

  @Column({ name: 'affiliate_program_id', nullable: true })
  affiliate_program_id?: number;
}
