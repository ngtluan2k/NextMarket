import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';

@Entity('affiliate_programs')
export class AffiliateProgram {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  uuid?: string;

  @Column()
  name?: string;

  @Column({ name: 'cookie_days' })
  cookieDays?: number;

  @Column({ name: 'commission_type' })
  commissionType?: string; // percentage | fixed

  @Column({ name: 'commission_value', type: 'decimal' })
  commissionValue?: number;

  @Column()
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt?: Date;

  @OneToMany(() => AffiliateLink, (link) => link.program_id)
  links?: AffiliateLink[];
}
