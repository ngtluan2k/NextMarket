import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { SubscriptionUsage } from '../subscription_usages/subscription_usage.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid!: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Product, (product) => product.id, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product!: Product | null;

  @ManyToOne(() => Variant, (variant) => variant.id, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant!: Variant | null;

  @ManyToOne(() => PricingRules, (rule) => rule.id, { nullable: true })
  @JoinColumn({ name: 'pricing_rule_id' })
  pricingRule!: PricingRules | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cycle!: string; // vd: "30 days", "1 month"

  @Column({ name: 'total_quantity', type: 'int', default: 0 })
  totalQuantity!: number;

  @Column({ name: 'remaining_quantity', type: 'int', default: 0 })
  remainingQuantity!: number;

  @Column({ name: 'start_date', type: 'datetime', nullable: true })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'datetime', nullable: true })
  endDate!: Date;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string; // active, expired, canceled, paused

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => SubscriptionUsage, (usage) => usage.subscription)
  usages!: SubscriptionUsage[];
}
