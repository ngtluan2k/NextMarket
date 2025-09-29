import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Generated } from 'typeorm';
import { StoreInformation } from './../store-information/store-information.entity';

@Entity('store_documents')
export class StoreDocument {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'char', length: 36, unique: true })
  @Generated('uuid')
  uuid!: string;

  @Column()
  store_information_id!: number;

  @ManyToOne(() => StoreInformation)
  @JoinColumn({ name: 'store_information_id' })
  storeInformation!: StoreInformation;

  @Column({ length: 100 })
  doc_type!: string;

  @Column({ length: 500 })
  file_url!: string;

  @Column({ type: 'boolean', default: false })
  verified!: boolean;

  @Column({ type: 'datetime', nullable: true })
  verified_at!: Date | null;
}