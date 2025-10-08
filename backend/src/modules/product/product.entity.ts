import { ProductCategory } from '../product_category/product_category.entity';
import { ProductMedia } from '../product_media/product_media.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { Store } from '../store/store.entity';
import { Brand } from '../brands/brand.entity';
import { Inventory } from '../inventory/inventory.entity';
import { Subscription } from '../subscription/subscription.entity';
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
import { OrderItem } from '../order-items/order-item.entity';
import { ProductTag } from '../product_tag/product_tag.entity';
import { ProductReview } from '../product_reviews/product_review.entity';
import { GroupOrderItem } from '../group_orders_items/group_orders_item.entity';

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

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  avg_rating!: number;

  @Column({ type: 'int', default: 0 })
  review_count!: number;

  

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
  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];

  @OneToMany(() => ProductTag, (pt) => pt.product)
  productTags!: ProductTag[];

  @OneToMany(() => ProductReview, (reviews) => reviews.product)
  reviews!: ProductReview[];

  @OneToMany(() => Subscription, (sub) => sub.product)
  subscriptions!: Subscription[];
  @OneToMany(() => GroupOrderItem, (item) => item.product)
  group_order_items!: GroupOrderItem[];

}
