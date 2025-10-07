import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';

@Entity('order_invoices')
export class OrderInvoice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Order, (order) => order.orderInvoice, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'invoice_number', type: 'varchar', length: 64, unique: true })
  invoiceNumber!: string;

  @Column({ name: 'tax_number', type: 'varchar', length: 64, nullable: true })
  taxNumber?: string;

  @Column({
    name: 'company_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  companyName?: string;

  @Column({
    name: 'company_address',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  companyAddress?: string;

  @Column({
    name: 'total_tax',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalTax?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
