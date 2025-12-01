import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from '../referral/referrals.entity';
import { User } from '../user/user.entity';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';
import { AffiliateCommissionRule } from '../affiliate-rules/affiliate-rules.entity';
import { AffiliateProgramParticipant } from '../affiliate-program/affiliate-program-participant.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { AffiliateRootTracking } from '../affiliate-root-tracking/dto/affiliate-root-tracking.entity';
import { AffiliateTreeService } from './affiliate-tree.service';
import { AffiliateTreeController, UserAffiliateTreeController } from './affiliate-tree.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Referral, User, AffiliateCommission, AffiliateCommissionRule, AffiliateProgramParticipant, AffiliateProgram, AffiliateRootTracking]), UserModule],
  providers: [AffiliateTreeService],
  controllers: [AffiliateTreeController, UserAffiliateTreeController],
  exports: [AffiliateTreeService, TypeOrmModule],
})
export class AffiliateTreeModule {}
