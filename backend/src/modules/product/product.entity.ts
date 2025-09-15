import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductMedia } from './product-media.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid!: string;

  @Column({ type: 'int', nullable: true })
  store_id!: number;

  @Column({ type: 'int', nullable: true })
  brand_id!: number;

  @Column({ type: 'int', nullable: true })
  category_id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  short_description!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'decimal', nullable: true })
  base_price!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status!: string;

  @Column({ type: 'datetime', nullable: true })
  created_at!: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_at!: Date;

  @OneToMany(() => ProductMedia, media => media.product)
  media!: ProductMedia[];
}
