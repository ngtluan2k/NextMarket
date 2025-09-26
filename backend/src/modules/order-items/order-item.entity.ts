import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Order, (order) => order.orderItem, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Variant, (variant) => variant.orderItems, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant?: Variant | null;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Column({type: 'decimal', precision: 12, scale: 2, nullable: true,})
  discount?: number;

  @Column({type: 'decimal', precision: 12, scale: 2, nullable: true,})
  subtotal?: number;
}
