import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  Transaction,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { PaymentTransaction } from '../payment-transactions/payment-transaction.entity';
import { Refund } from '../refunds/refund.entity';

export enum PaymentStatus {
  Unpaid = 0,
  Paid = 1,
  Failed = 2,
  Refunded = 3,
  Pending = 4,
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Order, (order) => order.id, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod?: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider?: string;

  @Column({
    name: 'transaction_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  transactionId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount?: number;

  @Column({ type: 'integer', default: PaymentStatus.Pending })
  status!: PaymentStatus;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ name: 'raw_payload', type: 'text', nullable: true })
  rawPayload?: string;
  
  @Column({
    name: 'is_group',
    type: 'boolean',
    default: false,
    comment: 'Đánh dấu thanh toán cho group order',
  })
  isGroup!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => PaymentTransaction, (transaction) => transaction.payment)
  transaction!: Transaction[];

  @OneToMany(() => Refund, (refund) => refund.payment)
  refund!: Refund[];
}
