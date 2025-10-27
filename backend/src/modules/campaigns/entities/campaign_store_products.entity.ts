import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Generated,
} from 'typeorm';
import { CampaignStore } from './campaign_stores.ts.entity';
import { Product } from '../../product/product.entity';
import { Variant } from '../../variant/variant.entity';

@Entity('campaign_store_products')
export class CampaignStoreProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => CampaignStore, (cs) => cs.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_store_id' })
  campaignStore!: CampaignStore;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Variant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant!: Variant;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  promo_price?: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status!: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt!: Date;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt?: Date;
}
