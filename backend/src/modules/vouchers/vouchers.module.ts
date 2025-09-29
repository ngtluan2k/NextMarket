import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VouchersService } from './vouchers.service';
import { AdminVouchersController } from './admin-vouchers.controller';
import { UserVouchersController } from './user-vouchers.controller';
import { StoreOwnerVouchersController } from './store-owner-vouchers.controller';
import { Voucher } from './vouchers.entity';
import { VoucherUsage } from '../voucher-usage/voucher_usage.entity';
import { User } from '../user/user.entity';
import { Order } from '../orders/order.entity';
import { Store } from '../store/store.entity';
import { VoucherUsageModule } from '../voucher-usage/voucher-usage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Voucher, VoucherUsage, User, Order, Store]),
    VoucherUsageModule,
  ],
  controllers: [AdminVouchersController, UserVouchersController, StoreOwnerVouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}