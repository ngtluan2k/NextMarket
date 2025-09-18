import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { Category } from '../categories/category.entity';

@Entity('product_category')
export class ProductCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, (product) => product.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column()
  category_id!: number;

  @ManyToOne(() => Category, (category) => category.productCategories, {
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  // @CreateDateColumn()
  // created_at!: Date;

  // @UpdateDateColumn()
  // updated_at!: Date;
}
