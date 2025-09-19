import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Generated } from 'typeorm';
import { Store } from './../store/store.entity';

@Entity('store_bank_accounts')
export class StoreBankAccount {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  store_id!: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ length: 100 })
  bank_name!: string;

  @Column({ length: 50 })
  account_number!: string;

  @Column({ length: 255 })
  account_holder!: string;

  @Column({ type: 'boolean', default: false })
  is_default!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}