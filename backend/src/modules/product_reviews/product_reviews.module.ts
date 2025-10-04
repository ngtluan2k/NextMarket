import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReview } from './product_review.entity';
import { ProductReviewsService } from './product_reviews.service';
import { ProductReviewsController } from './product_reviews.controller';
import { ProductModule } from '../product/product.module';
import { OrdersModule } from '../orders/orders.module';
import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';
import { Order } from '../orders/order.entity';
import { Store } from '../store/store.entity';
import { UserModule } from '../user/user.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([ProductReview, Product, Order, User, Store]),
    forwardRef(() => UserModule),
    forwardRef(() => ProductModule),
    forwardRef(() => OrdersModule),
  ],
  controllers: [ProductReviewsController],
  providers: [ProductReviewsService],
  exports: [ProductReviewsService],
})
export class ProductReviewsModule {}
