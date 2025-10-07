import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateLinksService } from './affiliate-links.service';
import { AffiliateLinksController } from './affiliate-links.controller';
import { AffiliateLink } from './affiliate-links.entity';
import { UserModule } from '../user/user.module';
import { AffiliateCommissionsModule } from '../affiliate-commissions/affiliate-commissions.module';
import { AffiliateCommission } from '../affiliate-commissions/affiliate-commission.entity';
import { AffiliateProgramsModule } from '../affiliate-program/affiliate-program.module';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateLink, AffiliateCommission, AffiliateProgram]),
    UserModule,
    AffiliateCommissionsModule,
    AffiliateProgramsModule,
  ],
  controllers: [AffiliateLinksController],
  providers: [AffiliateLinksService],
  exports: [AffiliateLinksService],
})
export class AffiliateLinksModule {}
