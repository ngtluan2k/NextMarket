import { ProductCategory } from '../product_category/product_category.entity';
import { ProductMedia } from '../product_media/product_media.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { Store } from '../store/store.entity';
import { Brand } from '../brands/brand.entity';
import { Inventory } from '../inventory/inventory.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  JoinColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  store_id!: number;

  @ManyToOne(() => Store, (store) => store.products)
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column()
  brand_id!: number;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  short_description?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  base_price?: number;

  @Column({ default: 'draft' })
  status!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // === Relations ===
  @OneToMany(() => ProductCategory, (pc) => pc.product, { cascade: true })
  categories!: ProductCategory[];

  @OneToMany(() => ProductMedia, (media) => media.product)
  media!: ProductMedia[];

  @OneToMany(() => Variant, (variant) => variant.product)
  variants!: Variant[];

  @OneToMany(() => PricingRules, (pr) => pr.product)
  pricing_rules!: PricingRules[];

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventories!: Inventory[];
}
