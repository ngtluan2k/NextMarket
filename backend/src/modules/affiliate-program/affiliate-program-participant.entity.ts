import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { AffiliateProgram } from './affiliate-program.entity';

@Entity('affiliate_program_participants')
@Index(['user_id', 'program_id'], { unique: true })
export class AffiliateProgramParticipant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  user_id!: number;

  @Column({ type: 'int' })
  program_id!: number;

  @Column({ 
    type: 'enum', 
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  })
  status!: string;

  @CreateDateColumn()
  joined_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => AffiliateProgram)
  @JoinColumn({ name: 'program_id' })
  program!: AffiliateProgram;
}
