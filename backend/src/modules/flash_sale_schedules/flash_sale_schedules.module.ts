import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSaleSchedulesService } from './flash_sale_schedules.service';
import { FlashSaleSchedulesController } from './flash_sale_schedules.controller';
import { FlashSaleSchedule } from './entities/flash_sale_schedule.entity';
import { StoreLevel } from '../store-level/store-level.entity';
import { Product } from '../product/product.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { OrderItem } from '../order-items/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FlashSaleSchedule, // 👈 phải khai báo entity này
      StoreLevel,   
      Product,
      PricingRules,
      OrderItem     // 👈 và entity này nữa
    ]),
  ],
  controllers: [FlashSaleSchedulesController],
  providers: [FlashSaleSchedulesService],
  exports: [FlashSaleSchedulesService],
})
export class FlashSaleSchedulesModule {}
