// src/entities/Wallet.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WalletTransaction } from '.././wallet_transaction/wallet_transaction.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid!: string;

  @Column()
  user_id!: number;

  @Column({ type: 'decimal', default: 0 })
  balance!: number;

  @Column({ type: 'varchar', default: 'VND' })
  currency!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @OneToMany(() => WalletTransaction, (tx) => tx.wallet)
  transactions!: WalletTransaction[];
}
