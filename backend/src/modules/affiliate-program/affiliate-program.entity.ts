import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';

@Entity('affiliate_programs')
export class AffiliateProgram {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'uuid',
    unique: true,
    nullable: false,
    default: () => 'gen_random_uuid()',
  })
  uuid!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'int' })
  cookie_days!: number;

  @Column({ length: 255 })
  commission_type!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commission_value!: number;

  @Column({ length: 255 })
  status!: string;

  @Column({ type: 'timestamp' })
  created_at!: Date;

  @OneToMany(() => AffiliateLink, (link) => link.program_id)
  links!: AffiliateLink[];
}
