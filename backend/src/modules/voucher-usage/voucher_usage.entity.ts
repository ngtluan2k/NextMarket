import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Voucher } from '../vouchers/vouchers.entity';
import { User } from '../user/user.entity';
// import { Order } from '../order/order.entity';

@Entity('voucher_usage')
export class VoucherUsage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid!: string;

  @ManyToOne(() => Voucher, (voucher) => voucher.usages)
  voucher!: Voucher;

  @ManyToOne(() => User, (user) => user.voucherUsages)
  user!: User;

//   @ManyToOne(() => Order, (order) => order.voucherUsages)
//   order: Order;

  @Column({ type: 'datetime' })
  used_at!: Date;
}
