import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('store_information_email')
export class StoreInformationEmail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, unique: true })
  email!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}