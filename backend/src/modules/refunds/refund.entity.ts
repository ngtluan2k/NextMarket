import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { Payment } from '../payments/payment.entity';

export enum RefundStatus {
  Requested = 0,
  Processing = 1,
  Completed = 2,
  Failed = 3,
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount?: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'tinyint', default: RefundStatus.Requested })
  status!: RefundStatus;

  @Column({ name: 'requested_at', type: 'timestamp', nullable: true })
  requestedAt?: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;
}
