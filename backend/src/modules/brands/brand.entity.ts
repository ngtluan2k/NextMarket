import { Entity, PrimaryGeneratedColumn, Column, Generated } from 'typeorm';
import { OneToMany } from 'typeorm';
import { Product } from '../product/product.entity';
@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ length: 255, nullable: true })
  logo_url!: string;

  @Column({ type: 'timestamp', nullable: true })
  created_at!: Date;

  @OneToMany(() => Product, (product) => product.brand)
  products!: Product[]; // <-- thêm dòng này
}
