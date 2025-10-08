import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateRegistrationPlatform } from './affiliate-registration-platform.entity';
import { AffiliateRegistrationPlatformService } from './affiliate-registration-platform.service';
import { AffiliateRegistrationPlatformController } from './affiliate-registration-platform.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateRegistrationPlatform])],
  providers: [AffiliateRegistrationPlatformService],
  controllers: [AffiliateRegistrationPlatformController],
  exports: [AffiliateRegistrationPlatformService],
})
export class AffiliateRegistrationPlatformModule {}
