import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { Order } from '../../orders/order.entity';

@Entity('affiliate_fraud_logs')
export class AffiliateFraudLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: ['SELF_REFERRAL', 'DUPLICATE_ORDER', 'SUSPICIOUS_IP', 'ABNORMAL_CONVERSION_RATE', 'RAPID_PURCHASE'],
  })
  fraud_type!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'affiliate_user_id' })
  affiliate_user?: User;

  @Column({ nullable: true })
  affiliate_user_id?: number;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @Column({ nullable: true })
  order_id?: number;

  @Column({ type: 'json', nullable: true })
  details?: any; // Chi tiết fraud

  @Column({ type: 'varchar', nullable: true, length: 50 })
  ip_address?: string;

  @CreateDateColumn()
  detected_at!: Date;

  @Column({ default: false })
  is_reviewed!: boolean; // Admin đã review chưa

  @Column({ type: 'varchar', nullable: true })
  admin_action?: string; // IGNORE, BAN_USER, SUSPEND_AFFILIATE

  @Column({ type: 'text', nullable: true })
  admin_notes?: string;

  @Column({ nullable: true })
  reviewed_by?: number; // Admin user ID

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at?: Date;
}
