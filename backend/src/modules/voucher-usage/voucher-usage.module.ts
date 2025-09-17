import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherUsageService } from './voucher-usage.service';
import { VoucherUsageController } from './voucher-usage.controller';
import { VoucherUsage } from '../voucher-usage/voucher_usage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VoucherUsage])],
  controllers: [VoucherUsageController],
  providers: [VoucherUsageService],
})
export class VoucherUsageModule {}
