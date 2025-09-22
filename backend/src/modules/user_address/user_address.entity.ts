// user-address.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Generated } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
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
  city!: string;

  @Column()
  province!: string;

  @Column()
  country!: string;

  @Column({ name: 'postal_code' })
  postalCode!: string;

  @Column({name:'is_default', default: true })
  isDefault!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
