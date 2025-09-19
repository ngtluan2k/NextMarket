import { Entity, JoinColumn, PrimaryGeneratedColumn, Column, Generated } from 'typeorm';
import { ManyToOne } from 'typeorm';
import { Product } from '../product/product.entity';

@Entity('pricing_rules')
export class PricingRules {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

   @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;


  @Column()
  type!: string;

  @Column({ nullable: true })
  min_quantity?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ nullable: true })
  cycle?: string;

  @Column({ nullable: true })
  starts_at?: Date;

  @Column({ nullable: true })
  ends_at?: Date;
}
