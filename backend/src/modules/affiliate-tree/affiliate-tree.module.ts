import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from '../referral/referrals.entity';
import { User } from '../user/user.entity';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';
import { AffiliateCommissionRule } from '../affiliate-rules/affiliate-rules.entity';
import { AffiliateTreeService } from './affiliate-tree.service';
import { AffiliateTreeController } from './affiliate-tree.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, User, AffiliateCommission, AffiliateCommissionRule]), UserModule],
  providers: [AffiliateTreeService],
  controllers: [AffiliateTreeController],
  exports: [AffiliateTreeService, TypeOrmModule],
})
export class AffiliateTreeModule {}
