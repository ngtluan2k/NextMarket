import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('affilate_calculateType')
export class CalculateCommissionType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: false })
  uuid!: string;

  @Column({ type: 'varchar', nullable: false })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string;

  @Column({ type: 'timestamp', nullable: false })
  created_at!: Date;
}