import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StoreInformation } from '../store-information/store-information.entity';

@Entity('store_information_email')
export class StoreInformationEmail {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column()
  store_information_id!: number;

  @ManyToOne(() => StoreInformation)
  @JoinColumn({ name: 'store_information_id' })
  storeInformation!: StoreInformation;

  @Column({ length: 100, unique: true })
  email!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  // @Column({ type: 'boolean', default: false })
  // is_draft!: boolean;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
