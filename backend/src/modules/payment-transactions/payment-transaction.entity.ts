import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Payment } from '../payments/payment.entity';

export enum PaymentTransactionStatus {
  Pending = 0,
  Success = 1,
  Failed = 2,
}

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Payment, { nullable: false })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @Column({ name: 'provider_transaction_id', type: 'varchar', length: 255, nullable: true })
  providerTransactionId?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  amount?: number;

  @Column({ type: 'tinyint', default: PaymentTransactionStatus.Pending })
  status!: PaymentTransactionStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt!: Date;
}
