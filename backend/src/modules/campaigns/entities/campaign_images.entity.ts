import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity('campaign_images')
export class CampaignImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  uuid!: string;

  @ManyToOne(() => Campaign, (c) => c.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @Column({ name: 'image_url' })
  imageUrl!: string;

  @Column({ name: 'link_url', nullable: true })
  linkUrl?: string;

  @Column({ default: 0 })
  position!: number;
}
