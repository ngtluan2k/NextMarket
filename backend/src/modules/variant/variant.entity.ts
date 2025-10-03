import {
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { Inventory } from '../inventory/inventory.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { ProductReview } from '../product_reviews/product_review.entity';

@Entity('variants')
export class Variant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ unique: true })
  sku!: string;

  @Column()
  variant_name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ nullable: true })
  stock?: number;

  @Column({ nullable: true })
  barcode?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;


  

  // === Relations ===
  @OneToMany(() => Inventory, (inventories) => inventories.variant)
  inventories!: Inventory[];
  @OneToMany(() => OrderItem, (item) => item.variant)
  orderItems!: OrderItem[];

}
