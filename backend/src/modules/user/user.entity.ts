import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  Generated,
} from 'typeorm';
import { UserProfile } from '../admin/entities/user-profile.entity';
import { UserRole } from '../user-role/user-role.entity';
import { VoucherUsage } from '../voucher-usage/voucher_usage.entity';
import { ShoppingCart } from '../cart/cart.entity';
import { Order } from '../orders/order.entity';
import { OrderStatusHistory } from '../order-status-history/order-status-history.entity';
import { Store } from '../store/store.entity';
import { ProductReview } from '../product_reviews/product_review.entity';
import { Subscription } from '../subscription/subscription.entity';
import { AffiliateRegistration } from '../affiliate-registration/affiliate-registration.entity';

import { InventoryTransaction } from '../inventory-transactions/inventory-transaction.entity';
import { GroupOrder } from '../group_orders/group_orders.entity';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { VoucherCollection } from '../voucher-collection/voucher-collection.entity';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column({ nullable: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  status!: string;

  @Column({ nullable: true, unique: true })
  code!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  updated_at!: Date;

  @Column({ default: false })
  is_affiliate!: boolean;

  @OneToOne(() => Store, (store) => store.user, { cascade: true })
  store!: Store;

  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
  })
  profile!: UserProfile;

  @OneToMany(() => UserRole, (userRole) => userRole.user, { cascade: true })
  roles!: UserRole[];

  @OneToMany(() => VoucherUsage, (usage) => usage.user)
  voucherUsages!: VoucherUsage[];
  @OneToOne(() => ShoppingCart, (cart) => cart.user, { cascade: true })
  cart!: ShoppingCart;
  @OneToMany(() => Order, (order) => order.user, { cascade: true })
  orders!: Order[];
  @OneToMany(() => OrderStatusHistory, (history) => history.changedBy)
  orderStatusHistories!: OrderStatusHistory[];

  @OneToMany(() => ProductReview, (reviews) => reviews.user)
  reviews!: ProductReview[];

  @OneToMany(() => Subscription, (sub) => sub.user)
  subscriptions!: Subscription[];
  @OneToMany(() => AffiliateRegistration, (affiliate) => affiliate.user)
  affiliateRegistrations!: AffiliateRegistration[];
  @OneToMany(() => InventoryTransaction, (transaction) => transaction.createdBy)
  inventoryTransactions!: InventoryTransaction[];
  @OneToMany(() => GroupOrder, (groupOrder) => groupOrder.user)
  group_orders!: GroupOrder[];

  @OneToMany(() => GroupOrderMember, (member) => member.user)
  group_order_members!: GroupOrderMember[];
  @OneToMany(() => VoucherCollection, (collection) => collection.user)
  voucherCollections!: VoucherCollection[];
}
