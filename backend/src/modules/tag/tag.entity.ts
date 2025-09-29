import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Generated } from 'typeorm';
import { ProductTag } from '../product_tag/product_tag.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  name!: string;

  @OneToMany(() => ProductTag, (pt) => pt.tag)
  productTags!: ProductTag[];
}
