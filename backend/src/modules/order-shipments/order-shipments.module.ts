import { Module } from '@nestjs/common';
import { OrderShipmentsService } from './order-shipments.service';
import { OrderShipmentsController } from './order-shipments.controller';

@Module({
  controllers: [OrderShipmentsController],
  providers: [OrderShipmentsService],
})
export class OrderShipmentsModule {}
