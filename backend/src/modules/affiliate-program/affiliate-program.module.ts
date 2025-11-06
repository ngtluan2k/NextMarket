import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateProgramsService } from './affiliate-program.service';
import { AffiliateProgramsController } from './affiliate-program.controller';
import { AffiliateProgram } from './affiliate-program.entity';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { AffiliateRulesModule } from '../affiliate-rules/affiliate-rules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateProgram, AffiliateLink]),
    AffiliateRulesModule,
  ],
  controllers: [AffiliateProgramsController],
  providers: [AffiliateProgramsService],
  exports: [AffiliateProgramsService, TypeOrmModule],
})
export class AffiliateProgramsModule {}
