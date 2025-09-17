
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  Generated,
  OneToOne,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../user/user.entity';
import { OneToMany } from 'typeorm';
import { Product } from '../product/product.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  user_id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ length: 100, nullable: true })
  email!: string;

  @Column({ length: 20, nullable: true })
  phone!: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'closed'],
    default: 'inactive',
  })
  status!: 'active' | 'inactive' | 'suspended' | 'closed';

  @Column({ type: 'boolean', default: false })
  is_draft!: boolean;


  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @OneToMany(() => Product, (product) => product.store)
  products!: Product[]; // <-- thêm dòng này
  

}
