import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({type:'varchar', nullable:false , default: () => 'gen_random_uuid()'})
  uuid!:string;
  
  @Column({ type: 'int' })
  referrer_id!: number; // sponsor/upline

  @Column({ type: 'int' })
  referee_id!: number; // downline

  @Column({ type: 'varchar', length: 255, nullable: true })
  code!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  status!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at!: Date | null;
}

