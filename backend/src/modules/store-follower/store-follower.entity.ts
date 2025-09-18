import { Store } from './../store/store.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';
import { User } from './../user/user.entity';

@Entity('store_followers')
export class StoreFollower {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  store_id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  followed_at!: Date;
}
