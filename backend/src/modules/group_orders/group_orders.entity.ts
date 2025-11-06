import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  Generated,
} from 'typeorm';
import { Store } from '../store/store.entity';
import { User } from '../user/user.entity';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { GroupOrderItem } from '../group_orders_items/group_orders_item.entity';
import { OrderStatuses } from '../orders/types/orders';
import { Order } from '../orders/order.entity';

export type GroupOrderStatus = 'open' | 'locked' | 'completed' | 'cancelled';
export type DeliveryMode = 'host_address' | 'member_address';

@Entity('group_orders')
export class GroupOrder {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  join_code!: string | null;

  @Column({ type: 'varchar', nullable: true })
  invite_link!: string | null;

  @Column({
    type: 'enum',
    enum: ['open', 'locked', 'completed', 'cancelled'],
    default: 'open',
  })
  status!: GroupOrderStatus;

  @Column({ type: 'timestamp', nullable: true })
  expires_at!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @OneToMany(() => GroupOrderMember, (m) => m.group_order)
  members!: GroupOrderMember[];

  @OneToMany(() => GroupOrderItem, (item) => item.group_order)
  items!: GroupOrderItem[];

  @ManyToOne(() => Store, (store) => store.group_orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @ManyToOne(() => User, (user) => user.group_orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_user_id' })
  user!: User;

  @OneToMany(() => Order, (o) => o.group_order)
  orders!: Order[];

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    default: 0,
  })
  discount_percent!: number | null;

  @Column({
    type: 'enum',
    enum: ['host_address', 'member_address'],
    default: 'host_address',
  })
  delivery_mode!: 'host_address' | 'member_address';

  @Column({
    type: 'integer',
    default: OrderStatuses.pending,
    comment:
      'Trạng thái đơn hàng của nhóm: 0=pending, 1=confirmed, 2=processing, 3=shipped, 4=delivered, 5=completed, 6=cancelled, 7=returned',
  })
  order_status!: OrderStatuses;
}
