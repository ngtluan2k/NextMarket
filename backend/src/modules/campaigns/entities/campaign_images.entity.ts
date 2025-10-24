import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Campaign } from './campaign.entity';

@Entity('campaign_images')
export class CampaignImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Campaign, (c) => c.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @Column({ name: 'image_url' })
  imageUrl!: string;   // camelCase

  @Column({ name: 'link_url', nullable: true })
  linkUrl?: string;    // camelCase

  @Column({ default: 0 })
  position!: number;
}
