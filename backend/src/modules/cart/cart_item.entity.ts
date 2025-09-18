import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { ShoppingCart } from './shopping_cart.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid!: string;

  @ManyToOne(() => ShoppingCart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: ShoppingCart;

  @Column()
  cart_id!: number;

  @ManyToOne(() => Product, { eager: true }) // eager: lấy luôn product khi query item
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column()
  product_id!: number;

  @Column({ nullable: true })
  variant_id!: number;

  @Column({ default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  added_at!: Date;
}
