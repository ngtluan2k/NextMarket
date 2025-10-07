import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItemsService } from './order-items.service';
import { OrderItemsController } from './order-items.controller';
import { OrderItem } from './order-item.entity';
import { Order } from '../orders/order.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem, Order, Product, Variant])],
  controllers: [OrderItemsController],
  providers: [OrderItemsService],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}
