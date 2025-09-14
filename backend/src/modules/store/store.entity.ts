import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Generated, BeforeInsert } from 'typeorm';
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

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  owner!: User;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ length: 255, nullable: true })
  logo_url!: string;

  @Column({ length: 255, default: 'ACTIVE' })
  status!: string;
  @BeforeInsert()
setDefaultStatus() {
  if (!this.status) {
    this.status = 'ACTIVE';
  }
}

  @Column({ type: 'datetime', nullable: true })
  created_at!: Date;

  @Column({ type: 'datetime', nullable: true })
  updated_at!: Date;

 @OneToMany(() => Product, product => product.store)
  products!: Product[];   // <-- thêm dòng này
}
