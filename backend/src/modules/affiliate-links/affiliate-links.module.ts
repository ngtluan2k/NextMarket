import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateLinksService } from './affiliate-links.service';
import { AffiliateLinksController } from './affiliate-links.controller';
import { AffiliateLink } from './affiliate-links.entity';
import { AffiliateClick } from './entity/affiliate-click.entity';
import { AffiliateResolutionService } from './affiliate-resolution.service';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { Product } from '../product/product.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { AffiliateCommissionsModule } from '../affiliate-commissions/affiliate-commissions.module';
import { AffiliateProgramsModule } from '../affiliate-program/affiliate-program.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AffiliateLink,
      AffiliateClick,
      AffiliateCommission,
      AffiliateProgram,
      Product,
      OrderItem,
      User,
    ]),
    UserModule,
    AffiliateCommissionsModule,
    AffiliateProgramsModule,
    WalletModule,
  ],
  controllers: [AffiliateLinksController],
  providers: [AffiliateLinksService, AffiliateResolutionService],
  exports: [AffiliateLinksService, AffiliateResolutionService, TypeOrmModule],
})
export class AffiliateLinksModule {}
