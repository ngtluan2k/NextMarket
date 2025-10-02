// voucher-usage.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Generated,
  CreateDateColumn,
  JoinColumn
} from 'typeorm';
import { Voucher } from '../vouchers/vouchers.entity';
import { User } from '../user/user.entity';
import { Order } from '../orders/order.entity';

@Entity('voucher_usage')
export class VoucherUsage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Voucher, (voucher) => voucher.usages, { nullable: false })
  @JoinColumn({ name: 'voucher_id' })   // 👈 fix chỗ này
  voucher!: Voucher;

  @ManyToOne(() => User, (user) => user.voucherUsages, { nullable: false })
  @JoinColumn({ name: 'user_id' })      // 👈 fix chỗ này
  user!: User;

  @ManyToOne(() => Order, (order) => order.voucherUsages, { nullable: false })
  @JoinColumn({ name: 'order_id' })     // 👈 fix chỗ này
  order!: Order;

  @CreateDateColumn({ name: 'used_at', type: 'timestamp' })
  usedAt!: Date;
}
