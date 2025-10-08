import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';

@Entity('affiliate_programs')
export class AffiliateProgram {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
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

  @Column({ type: 'datetime' })
  created_at!: Date;

  @OneToMany(() => AffiliateLink, (link) => link.program_id)
  links!: AffiliateLink[];
}