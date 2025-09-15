import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from './../store/store.entity';
import { StoreDocument } from './../store-document/store-document.entity';
import { StoreInformationEmail } from './../store-information-email/store-information-email.entity';

@Entity('store_information')
export class StoreInformation {
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
  name!: string;

  @Column({ type: 'text', nullable: true })
  addresses!: string;

  @Column({ length: 50, nullable: true })
  tax_code!: string;

  @Column({ nullable: true })
  store_documents_id!: number;

  @ManyToOne(() => StoreDocument)
  @JoinColumn({ name: 'store_documents_id' })
  document!: StoreDocument;

  @Column({ nullable: true })
  store_information_email_id!: number;

  @ManyToOne(() => StoreInformationEmail)
  @JoinColumn({ name: 'store_information_email_id' })
  email_info!: StoreInformationEmail;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}