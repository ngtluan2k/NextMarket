import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateCommissionsService } from './affiliate-commissions.service';
import { AffiliateCommissionsController } from './affiliate-commissions.controller';
import { CommissionCalcService } from './commission-calc.service';
import { AffiliateCommission } from './affiliate-commission.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { Order } from '../orders/order.entity';
import { User } from '../user/user.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { WalletModule } from '../wallet/wallet.module';
import { AffiliateRulesModule } from '../affiliate-rules/affiliate-rules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AffiliateCommission, 
      OrderItem, 
      AffiliateLink, 
      Order, 
      User, 
      AffiliateProgram
    ]),
    WalletModule,
    AffiliateRulesModule,
  ],
  controllers: [AffiliateCommissionsController],
  providers: [AffiliateCommissionsService, CommissionCalcService],
  exports: [CommissionCalcService],
})
export class AffiliateCommissionsModule {}
