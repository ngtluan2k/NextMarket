import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';
import { Order } from '../../orders/order.entity';
import { User } from '../../user/user.entity';
import { Store } from '../../store/store.entity';
import { GroupOrder } from '../../group_orders/group_orders.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Store, { nullable: true })
  @JoinColumn({ name: 'store_id' })
  store?: Store;

  @ManyToOne(() => GroupOrder, { nullable: true })
  @JoinColumn({ name: 'group_order_id' })
  group_order?: GroupOrder;

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at?: Date;
}
