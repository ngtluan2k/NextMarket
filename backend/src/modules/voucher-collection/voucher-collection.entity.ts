import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Voucher } from '../vouchers/vouchers.entity';
import { User } from '../user/user.entity';

@Entity('voucher_collections')
export class VoucherCollection {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Voucher, (voucher) => voucher.collections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voucher_id' })
  voucher!: Voucher;

  @ManyToOne(() => User, (user) => user.voucherCollections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'collected_at' })
  collectedAt!: Date;
}
