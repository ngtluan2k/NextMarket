import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Store } from '../store/store.entity';
import { Order } from '../orders/order.entity';
import { UserAddress } from '../user_address/user_address.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { Inventory } from '../inventory/inventory.entity';
import { Payment } from '../payments/payment.entity';
import { VouchersModule } from '../vouchers/vouchers.module';
import { OrderStatusHistory } from '../order-status-history/order-status-history.entity';
import { ProductReviewsModule } from '../product_reviews/product_reviews.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      User,
      Store,
      UserAddress,
      OrderItem,
      Inventory,
      Payment,
      OrderStatusHistory,
    ]),
    VouchersModule,
    forwardRef(() => ProductReviewsModule), // 👈 thêm cái này
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
