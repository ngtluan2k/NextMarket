import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudDetectionService } from './service/fraud-detection.service';
import { FraudDetectionController } from './controller/fraud-detection.controller';
import { AffiliateFraudLog } from './entity/affiliate-fraud-log.entity';
import { Order } from '../orders/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AffiliateFraudLog, Order])],
  controllers: [FraudDetectionController],
  providers: [FraudDetectionService],
  exports: [FraudDetectionService],
})
export class AffiliateFraudModule {}
