import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { CampaignSectionItem } from './campaign_section_items.entity';
@Entity('campaign_sections')
export class CampaignSection {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Campaign, (c) => c.sections)
  @JoinColumn({ name: 'campaign_id' }) // khớp với DB column
  campaign!: Campaign;

  @Column({ type: 'varchar', length: 50 })
  type!: string; // banner | voucher | product | image | text

  @Column({ type: 'varchar', length: 255 })
  title!: string; // có thể chứa URL banner, danh sách product_id, voucher_id,...

  @Column({ type: 'int', default: 0 })
  position!: number; // để sắp thứ tự hiển thị trên FE

  @Column({ type: 'json', nullable: true, name: 'config_json' })
  configJson?: any;

  @OneToMany(() => CampaignSectionItem, (item) => item.section, {
    cascade: true,
  })
  items!: CampaignSectionItem[];
}
