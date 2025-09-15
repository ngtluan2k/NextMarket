import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Generated } from 'typeorm';
import { Store } from './../store/store.entity';

@Entity('store_documents')
export class StoreDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  store_id!: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ length: 100 })
  doc_type!: string;

  @Column({ length: 500 })
  file_url!: string;

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'datetime', nullable: true })
  verified_at!: Date;
}