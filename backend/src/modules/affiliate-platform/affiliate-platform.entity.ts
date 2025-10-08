import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { AffiliateRegistration } from '../affiliate-registration/affiliate-registration.entity';

@Entity('affiliate_platform')
export class AffiliatePlatform {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @ManyToMany(() => AffiliateRegistration, (registration) => registration.platforms)
  registrations!: AffiliateRegistration[];
}
