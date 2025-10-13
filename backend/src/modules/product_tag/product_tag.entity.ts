import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { Tag } from '../tag/tag.entity';

@Entity('product_tag')
export class ProductTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  product_id!: number;

  @ManyToOne(() => Product, (product) => product.productTags)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column()
  tag_id!: number;

  @ManyToOne(() => Tag, (tag) => tag.productTags)
  @JoinColumn({ name: 'tag_id' })
  tag!: Tag;
}
