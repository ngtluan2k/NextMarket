import {
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Generated,
  CreateDateColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { User } from '../user/user.entity';
export enum historyStatus{
  pending = 0,
  confirmed = 1,
  processing = 2,
  shipped = 3,
  delivered = 4,  
  completed = 5,
  cancelled = 6,
  returned = 7,
}

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Order, (order) => order.orderStatusHistory, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({
    name: 'old_status',
    type: 'tinyint',
    default: historyStatus.pending,
  })
  oldStatus!: historyStatus;

  @Column({
    name: 'new_status',
    type: 'tinyint',
    default: historyStatus.pending,
  })
  newStatus!: historyStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedBy?: User;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp' })
  changedAt!: Date;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
