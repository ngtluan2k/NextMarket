import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateCommissionRule } from './affiliate-rules.entity';
import { AffiliateRulesService } from './affiliate-rules.service';
import { AffiliateRulesController } from './affiliate-rules.controller';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateCommissionRule, AffiliateProgram])],
  controllers: [AffiliateRulesController],
  providers: [AffiliateRulesService],
  exports: [AffiliateRulesService, TypeOrmModule],
})
export class AffiliateRulesModule {}
