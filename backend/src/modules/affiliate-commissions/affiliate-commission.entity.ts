import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { Order } from '../orders/order.entity';

@Entity('affiliate_commissions')
export class AffiliateCommission {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid?: string;

  @ManyToOne(() => AffiliateLink, (link) => link.id)
  @JoinColumn({ name: 'link_id' })
  link_id?: AffiliateLink;

  @ManyToOne(() => Order, (order) => order.id)
  @JoinColumn({ name: 'order_id' })
  order_id?: Order;

  @Column({ type: 'decimal' })
  amount?: number;

  @Column({ length: 255 })
  status?: string;

  @Column({ type: 'datetime' })
  created_at?: Date;

  @Column({ type: 'datetime', nullable: true })
  paid_at?: Date;
}