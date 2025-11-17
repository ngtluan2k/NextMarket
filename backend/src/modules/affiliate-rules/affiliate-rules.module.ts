import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateCommissionRule } from './affiliate-rules.entity';
import { AffiliateRulesService } from './affiliate-rules.service';
import { AffiliateRulesController } from './affiliate-rules.controller';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { CalculationMethodService } from './service/rule-calculator.service';
import { CalculateCommissionType } from '../affiliate-calculation-method/dto/calculate-commission-type.dto';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateCommissionRule, AffiliateProgram, CalculateCommissionType])],
  controllers: [AffiliateRulesController],
  providers: [AffiliateRulesService, CalculationMethodService],
  exports: [AffiliateRulesService, TypeOrmModule],
})
export class AffiliateRulesModule {}
