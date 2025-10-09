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
import { Order } from '../orders/order.entity';

export type GroupOrderStatus = 'open' | 'locked' | 'completed' | 'cancelled';

@Entity('group_orders')
export class GroupOrder {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 12, nullable: true, unique: true })
  join_code!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
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
}
