import {
  Entity,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  OneToMany,
} from 'typeorm';
import { Payment } from '../payments/payment.entity';
@Entity('payment_methods')
export class PaymentMethod {

    @PrimaryGeneratedColumn()
    id!:number

    @Column({ type: 'char', length: 36, unique: true })
    @Generated('uuid')
    uuid!: string;

    @Column({type: 'varchar', length: 255})
    name!: string;

    @Column({type: 'varchar', length: '255', nullable: true})
    type!: string;

    @Column({type: 'json', nullable: true})
    config!: Record<string,any>

    @Column({type:'boolean', default: true})
    enabled!: boolean

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @OneToMany(() => Payment, (payment) => payment.paymentMethod)
    payment?: Payment[];
    
}
