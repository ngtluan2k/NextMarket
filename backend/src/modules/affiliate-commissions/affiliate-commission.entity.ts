import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { User } from '../user/user.entity';

@Entity('affiliate_commissions')
export class AffiliateCommission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  uuid!: string;

  @ManyToOne(() => AffiliateLink, (link) => link.commissions, { nullable: true })
  @JoinColumn({ name: 'link_id' })
  link_id?: AffiliateLink;

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.commissions, { nullable: true })
  @JoinColumn({ name: 'order_item_id' })
  order_item_id?: OrderItem;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 255 })
  status!: string;

  @Column({ type: 'timestamp' })
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at?: Date;

  // Thêm các trường mới cho affiliate tree
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'beneficiary_user_id' })
  beneficiary_user_id!: User;

  @Column({ type: 'int', nullable: true })
  level!: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  base_amount!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  rate_percent!: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  computed_amount!: number | null;

  @Column({ type: 'int', nullable: true })
  program_id!: number | null;
}
