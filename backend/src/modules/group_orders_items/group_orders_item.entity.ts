import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { GroupOrder } from '../group_orders/group_orders.entity';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';

@Entity('group_order_items')
export class GroupOrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => GroupOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_order_id' })
  group_order!: GroupOrder;

  @ManyToOne(() => GroupOrderMember, (m) => m.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member!: GroupOrderMember;

  @Column({ type: 'int', default: () => '1' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @ManyToOne(() => Product, (p) => p.group_order_items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
  
   @ManyToOne(() => Variant, { nullable: true, onDelete: 'CASCADE' }) // ✅ THÊM VARIANT RELATION
  @JoinColumn({ name: 'variant_id' })
  variant!: Variant | null;


}
