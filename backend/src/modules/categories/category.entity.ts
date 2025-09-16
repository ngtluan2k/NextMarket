import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany, 
  JoinColumn, 
  CreateDateColumn, 
  Generated 
} from 'typeorm';
import { ProductCategory } from '../product_category/product_category.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column({ type: 'int', nullable: true })
  parent_id!: number | null;

  @ManyToOne(() => Category, (c) => c.children, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category | null;

  @OneToMany(() => Category, (c) => c.parent)
  children?: Category[];

  // 🔥 Thêm quan hệ ngược
  @OneToMany(() => ProductCategory, (pc) => pc.category)
  productCategories!: ProductCategory[];

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn()
  created_at!: Date;

}
