import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';

@Entity('affiliate_programs')
export class AffiliateProgram {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'uuid',
    unique: true,
    nullable: false,
    default: () => 'gen_random_uuid()',
  })
  uuid!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'int' })
  cookie_days!: number;

  @Column({ length: 255 })
  commission_type!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commission_value!: number;

  @Column({ length: 255 })
  status!: string;

  @Column({ type: 'timestamp' })
  created_at!: Date;

  // Budget tracking fields
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_budget_amount!: number; // Tổng ngân sách (VND)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  spent_budget!: number; // Đã chi

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  pending_budget!: number; // Đang pending

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  monthly_budget_cap?: number; // Cap theo tháng

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  daily_budget_cap?: number; // Cap theo ngày

  @Column({ default: false })
  auto_pause_on_budget_limit!: boolean; // Tự động tạm dừng khi hết budget

  @Column({ type: 'varchar', length: 255, nullable: true })
  paused_reason?: string; // Lý do tạm dừng

  @OneToMany(() => AffiliateLink, (link) => link.program_id)
  links!: AffiliateLink[];
}
