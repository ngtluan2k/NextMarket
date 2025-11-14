import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { GroupOrder } from '../group_orders/group_orders.entity';
import { User } from '../user/user.entity';
import { GroupOrderItem } from '../group_orders_items/group_orders_item.entity';
import { UserAddress } from '../user_address/user_address.entity';

export type GroupOrderMemberStatus = 'joined' | 'left' | 'ordered';

@Entity('group_order_members')
export class GroupOrderMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => GroupOrder, (go) => go.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_order_id' })
  group_order!: GroupOrder;

  @Column({ type: 'boolean', default: false })
  is_host!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  joined_at!: Date;

  @Column({
    type: 'enum',
    enum: ['joined', 'left', 'ordered'],
    default: 'joined',
  })
  status!: GroupOrderMemberStatus;

  @OneToMany(() => GroupOrderItem, (i) => i.member)
  items!: GroupOrderItem[];

  @ManyToOne(() => User, (user) => user.group_order_members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => UserAddress, { nullable: true })
  @JoinColumn({ name: 'address_id' })
  address_id?: UserAddress;

}
