import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderStatusHistory } from './order-status-history.entity';
import { Order } from '../orders/order.entity';
import { User } from '../user/user.entity';
import { OrderStatusHistoryService } from './order-status-history.service';
import { OrderStatusHistoryController } from './order-status-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderStatusHistory, Order, User])],
  controllers: [OrderStatusHistoryController],
  providers: [OrderStatusHistoryService],
  exports: [OrderStatusHistoryService],
})
export class OrderStatusHistoryModule {}
