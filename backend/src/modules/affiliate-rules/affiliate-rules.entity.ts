import { Column, Entity, PrimaryGeneratedColumn, DeleteDateColumn } from 'typeorm';

@Entity('affiliate_commission_rules')
export class AffiliateCommissionRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  program_id!: number | null;

  @Column({ type: 'int' })
  level!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  rate_percent!: string;

  @Column({ type: 'timestamp', nullable: true })
  active_from!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  active_to!: Date | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cap_per_order!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cap_per_user!: string | null;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}