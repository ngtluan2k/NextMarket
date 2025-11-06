import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
// import { OrdersController } from './orders.controller';
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
import { CartModule } from '../cart/cart.module';
import { AffiliateLinksModule } from '../affiliate-links/affiliate-links.module';
import { AffiliateCommissionsModule } from '../affiliate-commissions/affiliate-commissions.module';
import { UserOrdersController } from './UserOrdersController';
import { StoreOrdersController } from './StoreOrdersController';
import { AdminOrdersController } from './AdminOrdersController';
import{OrdersController} from './orders.controller'

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
    CartModule,
    VouchersModule,
    AffiliateLinksModule,
    AffiliateCommissionsModule,
    forwardRef(() => ProductReviewsModule),
  ],
  controllers: [
    OrdersController,         
    UserOrdersController,     
    StoreOrdersController,  
    AdminOrdersController,   
    // OrdersController,
    UserOrdersController,
    StoreOrdersController,
    AdminOrdersController,
    OrdersController,
  ],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
