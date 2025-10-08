import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Subscription } from '../subscription/subscription.entity';
import { Order } from '../orders/order.entity';

@Entity({ name: 'subscription_usages' })
export class SubscriptionUsage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Subscription, (sub) => sub.id)
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'used_quantity', type: 'int', default: 1 })
  usedQuantity!: number;

  @CreateDateColumn({ name: 'used_at' })
  usedAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note!: string;
}
