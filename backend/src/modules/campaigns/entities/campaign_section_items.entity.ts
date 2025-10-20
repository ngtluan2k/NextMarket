import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CampaignSection } from './campaign_sections.entity';

@Entity('campaign_section_items')
export class CampaignSectionItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  uuid!: string;

  @ManyToOne(() => CampaignSection, (section) => section.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section!: CampaignSection;

  @Column({
    type: 'enum',
    enum: ['product', 'voucher', 'image', 'html'],
  })
  itemType!: 'product' | 'voucher' | 'image' | 'html';

  @Column({ name: 'item_id', nullable: true })
  itemId?: number;

  @Column({ name: 'extra_data', type: 'json', nullable: true })
  extraData?: Record<string, any>;
}
