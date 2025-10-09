import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Variant } from '../variant/variant.entity';
import { User } from '../user/user.entity';
import { Inventory } from '../inventory/inventory.entity';
export enum TransactionType {
  IMPORT = 1,
  EXPORT = 2,
  ADJUSTMENT = 3,
}
@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  uuid!: string;

  @ManyToOne(() => Variant, (variant) => variant.inventoryTransactions, {
    nullable: false,
  })
  @JoinColumn({ name: 'variant_id' })
  variant!: Variant;

  @ManyToOne(() => Inventory, (inventory) => inventory.transactions, {
    nullable: false,
  })
  @JoinColumn({ name: 'inventory_id' })
  inventory!: Inventory;

  @Column()
  quantity!: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.IMPORT,
  })
  transactionType!: TransactionType;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User | null;
}
