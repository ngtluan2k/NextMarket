import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateCommissionsService } from './affiliate-commissions.service';
import { AffiliateCommissionsController } from './affiliate-commissions.controller';
import { AffiliateCommission } from './affiliate-commission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateCommission])],
  controllers: [AffiliateCommissionsController],
  providers: [AffiliateCommissionsService],
})
export class AffiliateCommissionsModule {}