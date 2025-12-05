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

  // thời gian bắt đầu, có default CURRENT_TIMESTAMP
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  starts_at!: Date;

  // thời gian kết thúc, có default hợp lệ (không còn '0000-00-00 00:00:00')
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  ends_at!: Date;

  @Column({ type: 'varchar', length: 50, default: 'upcoming' })
  status!: 'upcoming' | 'active' | 'ended';

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 6,
  })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    precision: 6,
  })
  updated_at!: Date;

  @OneToMany(() => PricingRules, (rule) => rule.schedule)
  pricing_rules!: PricingRules[];
}
