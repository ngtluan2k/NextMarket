import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateRegistration } from './affiliate-registration.entity';
import { AffiliatePlatform } from '../affiliate-platform/affiliate-platform.entity';
import { AffiliateRegistrationService } from './affiliate-registration.service';
import { AffiliateRegistrationController } from './affiliate-registration.controller';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateRegistration, AffiliatePlatform, User]), // ✅ thêm AffiliatePlatform vào đây
  ],
  controllers: [AffiliateRegistrationController],
  providers: [AffiliateRegistrationService],
  exports: [AffiliateRegistrationService],
})
export class AffiliateRegistrationModule {}
