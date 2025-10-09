// src/entities/WalletTransaction.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from '.././wallet/wallet.entity';

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  uuid!: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet!: Wallet;

  @Column()
  wallet_id!: number;

  @Column({ type: 'varchar', length: 50 })
  type!: string; // e.g., 'review_reward'

  @Column({ type: 'decimal' })
  amount!: number;

  @Column({ type: 'varchar', nullable: true })
  reference?: string; // ví dụ: 'review:123'

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;
}
