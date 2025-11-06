import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CalculationMethod {
  GEOMETRIC_DECAY = 'GEOMETRIC_DECAY',
  FIBONACCI_RATIO = 'FIBONACCI_RATIO',
  WEIGHTED_CUSTOM = 'WEIGHTED_CUSTOM'
}

@Entity('affiliate_rules')
export class AffiliateCommissionRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  program_id!: string; // ID chương trình affiliate

  @Column()
  name!: string; // Tên rule, vd: "Summer Campaign 2024"

  // === Cấu hình chung ===
  @Column('decimal', { precision: 5, scale: 2 })
  total_budget!: number; // Tổng % budget cho affiliate, vd: 36.00

  @Column('int')
  num_levels!: number; // Số cấp, vd: 5

  @Column({
    type: 'enum',
    enum: CalculationMethod
  })
  calculation_method!: CalculationMethod;

  // === Cấu hình theo method ===
  @Column('decimal', { precision: 4, scale: 2, nullable: true })
  decay_rate?: number; // Cho GEOMETRIC_DECAY, vd: 0.60

  @Column('int', { nullable: true })
  starting_index?: number; // Cho FIBONACCI_RATIO

  @Column('simple-array', { nullable: true })
  weights?: number[]; // Cho WEIGHTED_CUSTOM, vd: [50,25,15,7,3]

  // === Kết quả đã tính ===
  @Column('json')
  calculated_rates!: {
    level: number;
    rate: number;
    weight?: number;
  }[]; // Lưu kết quả đã tính, vd: [{level:1, rate:15.61}, ...]

  // === Giới hạn ===
  @Column('int', { nullable: true })
  cap_order?: number; // Giới hạn số đơn hàng

  @Column('int', { nullable: true })
  cap_user?: number; // Giới hạn số user

  @Column('int', { nullable: true })
  time_limit_days?: number; // Giới hạn thời gian (ngày)

  // === Metadata ===
  @Column('boolean', { default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}