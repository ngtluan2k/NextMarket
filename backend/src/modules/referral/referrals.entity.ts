import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({type:'varchar', nullable:false , default: () => 'gen_random_uuid()'})
  uuid?: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'referrer_id' })
  referrer!: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'referee_id' })
  referee!: User;

  @Column({ length: 255 })
  code?: string;

  @Column({ length: 255 })
  status?: string;

  @Column({ type: 'timestamp' })
  created_at?: Date;
}
