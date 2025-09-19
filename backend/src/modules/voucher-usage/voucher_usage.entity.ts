// voucher-usage.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Generated,
  CreateDateColumn,
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
  voucher!: Voucher;

  @ManyToOne(() => User, (user) => user.voucherUsages, { nullable: false })
  user!: User;

  @ManyToOne(() => Order, (order) => order.voucherUsages, { nullable: false })
  order!: Order;

  @CreateDateColumn({ name: 'used_at', type: 'timestamp' })
  usedAt!: Date;
}
