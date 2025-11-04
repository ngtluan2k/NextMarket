import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn, Generated } from 'typeorm';
import { Campaign } from './campaign.entity';
import { Store } from '../../store/store.entity';
import { CampaignStoreProduct } from './campaign_store_products.entity';

@Entity('campaign_stores')
export class CampaignStore {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Campaign, (c) => c.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' }) // <--- thêm dòng này
  campaign!: Campaign;

  @ManyToOne(() => Store, (s) => s.campaignStores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn({ name: 'registered_at' })
  registeredAt!: Date;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'rejected_reason', type: 'varchar', length: 255, nullable: true })
  rejectedReason?: string;


  @OneToMany(() => CampaignStoreProduct, (p) => p.campaignStore)
  products!: CampaignStoreProduct[];
}
