import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Generated,
} from 'typeorm';
import { CampaignStore } from './campaign_stores.ts.entity';
import { CampaignSection } from './campaign_sections.entity';
import { CampaignImage } from './campaign_images.entity';
import { CampaignVoucher } from './campaign_vouchers.entity';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  name!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ type: 'timestamp' })
  starts_at!: Date;
  @Column({ type: 'timestamp', nullable: true })  // Cho phép null hoặc không có giá trị mặc định
  ends_at!: Date

  @Column({ default: 'draft' })
  status!: string; // draft | pending | active | ended

  @Column({ nullable: true })
  banner_url?: string;

  @Column({ type: 'int' })
  created_by!: number;

  @Column({ name: 'background_color', nullable: true })
  backgroundColor?: string;

  // Quan hệ
  @OneToMany(() => CampaignStore, (cs) => cs.campaign)
  stores!: CampaignStore[];

  @OneToMany(() => CampaignSection, (cs) => cs.campaign)
  sections!: CampaignSection[];

  @OneToMany(() => CampaignImage, (img) => img.campaign)
  images!: CampaignImage[];

  @OneToMany(() => CampaignVoucher, (voucher) => voucher.campaign)
  vouchers!: CampaignVoucher[];
}
