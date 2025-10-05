import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherUsageService } from './voucher-usage.service';
import { VoucherUsageController } from './voucher-usage.controller';
import { VoucherUsage } from './voucher_usage.entity';
import { Voucher } from '../vouchers/vouchers.entity';
import { User } from '../user/user.entity';
import { Order } from '../orders/order.entity';
import { Store } from '../store/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VoucherUsage, Voucher, User, Order, Store]),
  ],
  controllers: [VoucherUsageController],
  providers: [VoucherUsageService],
  exports: [VoucherUsageService],
})
export class VoucherUsageModule {}
