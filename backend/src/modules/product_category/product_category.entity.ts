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

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;


  @ManyToOne(() => Product, (product) => product.categories, {
    onDelete: 'CASCADE',
    nullable: false,
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
