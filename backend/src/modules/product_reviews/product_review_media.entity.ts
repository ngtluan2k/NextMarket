import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProductReview } from './product_review.entity';

@Entity('product_review_media')
export class ProductReviewMedia {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ProductReview, (review) => review.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review!: ProductReview;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'enum', enum: ['image', 'video'], default: 'image' })
  type!: 'image' | 'video';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
