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

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
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

  @Column({ type: 'datetime', nullable: true })
  created_at!: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_at!: Date;

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
  @OneToMany(() => Order, (order) => order.user,{cascade: true} )
  orders!: Order[];
  @OneToMany(() => OrderStatusHistory, (history) => history.changedBy)
  orderStatusHistories!: OrderStatusHistory[];
}
