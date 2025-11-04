import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  Generated,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';

@Entity('shopping_carts')
export class ShoppingCart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', unique: true })
  @Generated('uuid')
  uuid!: string;

  @OneToOne(() => User, (user) => user.cart)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  user_id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  items!: CartItem[];
}

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  uuid!: string;

  @ManyToOne(() => ShoppingCart)
  @JoinColumn({ name: 'cart_id' })
  cart!: ShoppingCart;

  @Column()
  cart_id!: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column()
  product_id!: number;

  @ManyToOne(() => Variant, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant!: Variant | null;

  @Column({ nullable: true })
  variant_id!: number | null;

  @Column({ default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  added_at!: Date;

  @Column({ type: 'varchar' })
  type!: 'bulk' | 'subscription'| 'normal' | 'flash_sale';
  
  @Column({ type: 'boolean', default: false })
  is_group!: boolean

  @Column({ type: 'int', nullable: true })
  pricing_rule_id?: number; // <-- thêm cột này
}
