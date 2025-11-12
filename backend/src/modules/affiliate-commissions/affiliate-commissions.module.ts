import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateCommissionsService } from './service/affiliate-commissions.service';
import { AffiliateCommissionsController } from './controller/affiliate-commissions.controller';
import { CommissionCalcService } from './service/commission-calc.service';
import { CommissionRevesalService } from './service/commision-revesal.service';
import { AffiliateCommission } from './entity/affiliate-commission.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { Order } from '../orders/order.entity';
import { User } from '../user/user.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { WalletModule } from '../wallet/wallet.module';
import { AffiliateRulesModule } from '../affiliate-rules/affiliate-rules.module';
import { AffiliateFraudModule } from '../affiliate-fraud/affiliate-fraud.module';
import { AffiliateProgramsModule } from '../affiliate-program/affiliate-program.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AffiliateTreeModule } from '../affiliate-tree/affiliate-tree.module';

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
    AffiliateFraudModule,
    AffiliateProgramsModule,
    NotificationsModule,
    AffiliateTreeModule,
  ],
  controllers: [AffiliateCommissionsController],
  providers: [AffiliateCommissionsService, CommissionCalcService, CommissionRevesalService],
  exports: [CommissionCalcService, CommissionRevesalService],
})
export class AffiliateCommissionsModule {}
