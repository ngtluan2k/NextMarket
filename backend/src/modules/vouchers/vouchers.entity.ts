import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { VoucherUsage } from '../voucher-usage/voucher_usage.entity';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid!: string;

  @Column({ unique: true })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column()
  discount_type!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_value!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  min_order_amount!: number;

  @Column({ type: 'datetime' })
  start_date!: Date;

  @Column({ type: 'datetime' })
  end_date!: Date;

  @Column({ type: 'int', nullable: true })
  usage_limit!: number;

  @Column({ type: 'int', default: 0 })
  used_count!: number;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => VoucherUsage, (usage) => usage.voucher)
  usages!: VoucherUsage[];
}
