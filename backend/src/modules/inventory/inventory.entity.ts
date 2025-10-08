import {
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  UpdateDateColumn,
  Generated,
  OneToMany,
} from 'typeorm';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
import { InventoryTransaction } from '../inventory-transactions/inventory-transaction.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Product, (product) => product.inventories, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Variant, (variant) => variant.inventories, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant?: Variant | null;  

  @Column()
  location!: string;

  @Column()
  quantity!: number;
  
  

  @Column({ default: 0 })
  used_quantity!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => InventoryTransaction, (transaction) => transaction.inventory)
  transactions!: InventoryTransaction[];
}