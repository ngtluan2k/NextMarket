import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AffiliateRegistration } from '../affiliate-registration/affiliate-registration.entity';
import { AffiliatePlatform } from '../affiliate-platform/affiliate-platform.entity';

@Entity('affiliate_registration_platforms')
export class AffiliateRegistrationPlatform {
  @PrimaryColumn({ name: 'registration_id' })
  registrationId!: number;

  @PrimaryColumn({ name: 'platform_id' })
  platformId!: number;

  @ManyToOne(
    () => AffiliateRegistration,
    (registration) => registration.platforms,
    {
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({ name: 'registration_id' })
  registration!: AffiliateRegistration;

  @ManyToOne(() => AffiliatePlatform, (platform) => platform.registrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'platform_id' })
  platform!: AffiliatePlatform;
}
