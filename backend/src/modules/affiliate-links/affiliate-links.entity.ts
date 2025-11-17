import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Generated,
} from 'typeorm';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { User } from '../user/user.entity';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';

@Entity('affiliate_links')
export class AffiliateLink {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid?: string;

  @ManyToOne(() => AffiliateProgram, (program) => program.links)
  @JoinColumn({ name: 'program_id' })
  program_id?: AffiliateProgram;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user_id?: User;

  @Column({ length: 255, unique: true })
  code?: string;

  @Column({ type: 'timestamp' })
  created_at?: Date;

  @OneToMany(() => AffiliateCommission, (commission) => commission.link_id)
  commissions?: AffiliateCommission[];  
}
