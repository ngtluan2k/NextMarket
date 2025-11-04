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

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  starts_at!: Date;

  @Column({ type: 'timestamp' })
  ends_at!: Date;

  @Column({ type: 'varchar', length: 50, default: 'upcoming' })
  status!: 'upcoming' | 'active' | 'ended';

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  // 1 schedule có thể có nhiều pricing rules
  @OneToMany(() => PricingRules, (rule) => rule.schedule)
  pricing_rules!: PricingRules[];
}
