import {
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Generated,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';

@Entity('product_media')
export class ProductMedia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ nullable: true })
  variant_id?: number;

  @ManyToOne(() => Variant, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant?: Variant;

  @Column()
  media_type!: string;

  @Column()
  url!: string;

  @Column({ default: false })
  is_primary!: boolean;

  @Column({ nullable: true })
  sort_order?: number;
}
