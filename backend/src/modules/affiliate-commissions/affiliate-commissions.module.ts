import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateCommissionsService } from './affiliate-commissions.service';
import { AffiliateCommissionsController } from './affiliate-commissions.controller';
import { AffiliateCommission } from './affiliate-commission.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateCommission, OrderItem, AffiliateLink])],
  controllers: [AffiliateCommissionsController],
  providers: [AffiliateCommissionsService],
})
export class AffiliateCommissionsModule {}