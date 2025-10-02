import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid?: string;

  @ManyToOne(() => User, (user) => user.id)
  referrer_id: User;

  @ManyToOne(() => User, (user) => user.id)
  referee_id: User;

  @Column({ length: 255 })
  code?: string;

  @Column({ length: 255 })
  status?: string;

  @Column({ type: 'datetime' })
  created_at?: Date;
}