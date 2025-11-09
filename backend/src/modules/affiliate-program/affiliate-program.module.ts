import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateProgramsService } from './affiliate-program.service';
import { AffiliateProgramsController } from './affiliate-program.controller';
import { AffiliateProgram } from './affiliate-program.entity';
import { AffiliateProgramParticipant } from './affiliate-program-participant.entity';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { AffiliateRulesModule } from '../affiliate-rules/affiliate-rules.module';
import { BudgetTrackingService } from './service/budget-tracking.service';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateProgram, AffiliateProgramParticipant, AffiliateLink, AffiliateCommission]),
    AffiliateRulesModule,
  ],
  controllers: [AffiliateProgramsController],
  providers: [AffiliateProgramsService, BudgetTrackingService],
  exports: [AffiliateProgramsService, BudgetTrackingService, TypeOrmModule],
})
export class AffiliateProgramsModule {}
