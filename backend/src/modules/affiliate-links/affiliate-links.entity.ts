import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { User } from '../user/user.entity'; 

@Entity('affiliate_links')
export class AffiliateLink {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid?: string;

  @ManyToOne(() => AffiliateProgram, (program) => program.id)
  @JoinColumn({name: 'program_id'})
  program_id?: AffiliateProgram;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({name:'user_id'})
  user_id?: User;

  @Column({ length: 255, unique: true })
  code?: string;

  @Column({ type: 'datetime' })
  created_at?: Date;
}