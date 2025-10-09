// user-address.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Generated,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Order } from '../orders/order.entity';

@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  user_id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'recipient_name' })
  recipientName!: string;

  @Column()
  phone!: string;

  @Column()
  street!: string;

  @Column()
  ward!: string;

  @Column()
  district!: string;

  @Column()
  province!: string;

  @Column()
  country!: string;

  @Column({ name: 'postal_code' })
  postalCode!: string;

  @Column({ name: 'is_default', default: true })
  isDefault!: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @OneToMany(() => Order, (order) => order.userAddress, { cascade: true })
  orders!: Order;
}
