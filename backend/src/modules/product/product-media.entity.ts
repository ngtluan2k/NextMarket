import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_media')
export class ProductMedia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid!: string;

  @ManyToOne(() => Product, (product) => product.media)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column()
  product_id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  media_type!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url!: string;

  @Column({ type: 'boolean', default: false })
  is_primary!: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order!: number;
}
