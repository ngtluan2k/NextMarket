import { Module } from '@nestjs/common';
import { AffiliateCommissionsService } from './affiliate-commissions.service';
import { AffiliateCommissionsController } from './affiliate-commissions.controller';

@Module({
  controllers: [AffiliateCommissionsController],
  providers: [AffiliateCommissionsService],
})
export class AffiliateCommissionsModule {}
