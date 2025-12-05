import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateRootTracking } from './dto/affiliate-root-tracking.entity';
import { AffiliateRootTrackingService } from './service/affiliate-root-tracking.service';
import { AffiliateRootTrackingController } from './controller/affiliate-root-tracking.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateRootTracking])],
  controllers: [AffiliateRootTrackingController],
  providers: [AffiliateRootTrackingService],
  exports: [AffiliateRootTrackingService],
})
export class AffiliateRootTrackingModule {}