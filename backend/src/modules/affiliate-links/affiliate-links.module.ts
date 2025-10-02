import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateLinksService } from './affiliate-links.service';
import { AffiliateLinksController } from './affiliate-links.controller';
import { AffiliateLink } from './affiliate-links.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateLink])],
  controllers: [AffiliateLinksController],
  providers: [AffiliateLinksService],
})
export class AffiliateLinksModule {}