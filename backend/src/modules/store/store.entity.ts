import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, Generated, OneToOne, UpdateDateColumn, CreateDateColumn } from 'typeorm';
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

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  owner!: User;

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

  @CreateDateColumn({ type: 'datetime'})
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
<<<<<<< HEAD
}
=======

 @OneToMany(() => Product, product => product.store)
  products!: Product[];   // <-- thêm dòng này
}
>>>>>>> a7ed62425b572e13be474147b8ed61db58b15377
