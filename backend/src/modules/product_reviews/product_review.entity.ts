import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';
import { Order } from '../orders/order.entity';
import { ProductReviewMedia } from './product_review_media.entity';

@Entity('product_reviews')
@Unique(['order', 'product']) // ✅ chỉ cho 1 review/product trong 1 order
export class ProductReview {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, (order) => order.reviews, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => User, (user) => user.reviews, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Product, (product) => product.reviews, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  comment?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ProductReviewMedia, (media) => media.review, { cascade: true })
  media!: ProductReviewMedia[];
}
