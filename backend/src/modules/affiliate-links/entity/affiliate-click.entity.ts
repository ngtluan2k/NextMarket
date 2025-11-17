import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AffiliateLink } from '../affiliate-links.entity';

@Entity('affiliate_clicks')
export class AffiliateClick {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  click_id!: string; // Unique click ID from frontend

  @ManyToOne(() => AffiliateLink, { nullable: true })
  @JoinColumn({ name: 'affiliate_link_id' })
  affiliate_link?: AffiliateLink;

  @Column({ nullable: true })
  affiliate_link_id?: number;

  @Column({ type: 'varchar', length: 50 })
  affiliate_code!: string;

  @Column({ nullable: true })
  product_id?: number;

  @Column({ nullable: true })
  variant_id?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip_address?: string;

  @Column({ type: 'text', nullable: true })
  user_agent?: string;

  @Column({ type: 'text', nullable: true })
  referrer?: string;

  @Column({ type: 'json', nullable: true })
  utm_params?: any; // utm_source, utm_medium, etc.

  @CreateDateColumn()
  clicked_at!: Date;

  @Column({ default: false })
  converted!: boolean; // Has order been created?

  @Column({ nullable: true })
  order_id?: number; // If converted

  @Column({ type: 'timestamp', nullable: true })
  converted_at?: Date;
}
