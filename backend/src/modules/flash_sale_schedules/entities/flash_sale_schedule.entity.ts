import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PricingRules } from '../../pricing-rule/pricing-rule.entity';

@Entity('flash_sale_schedules')
export class FlashSaleSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'nvarchar', length: 255 })
  name!: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'datetime' })
  starts_at!: Date;

  @Column({ type: 'datetime' })
  ends_at!: Date;

  @Column({ type: 'nvarchar', length: 50, default: 'upcoming' })
  status!: 'upcoming' | 'active' | 'ended';

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  // 1 schedule có thể có nhiều pricing rules
  @OneToMany(() => PricingRules, (rule) => rule.schedule)
  pricing_rules!: PricingRules[];
}
