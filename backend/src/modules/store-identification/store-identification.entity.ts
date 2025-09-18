import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from './../store/store.entity';

@Entity('store_identification')
export class StoreIdentification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  store_id!: number;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ length: 50 })
  type!: string;

  @Column({ length: 255 })
  full_name!: string;

  @Column({ length: 255, nullable: true })
  img_front!: string;

  @Column({ length: 255, nullable: true })
  img_back!: string;

  @Column({ type: 'boolean', default: false })
  is_draft!: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
