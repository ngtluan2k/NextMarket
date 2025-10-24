import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { Voucher } from '../../vouchers/vouchers.entity';

@Entity('campaign_vouchers')
export class CampaignVoucher {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Campaign, (c) => c.vouchers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @ManyToOne(() => Voucher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voucher_id' })
  voucher!: Voucher;

  @Column({
    type: 'enum',
    enum: ['system', 'store'],
    default: 'system',
  })
  type!: 'system' | 'store';
}
