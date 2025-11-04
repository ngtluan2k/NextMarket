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
import { VouchersController } from './vouchers.controller';
import { VoucherCollection } from '../voucher-collection/voucher-collection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Voucher, VoucherUsage, User, Order, Store, VoucherCollection]),
    VoucherUsageModule,
  ],
  controllers: [
    AdminVouchersController,
    UserVouchersController,
    StoreOwnerVouchersController,
    VouchersController,
  ],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
