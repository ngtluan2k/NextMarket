import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderInvoice } from './order-invoice.entity';
import { OrderInvoicesService } from './order-invoices.service';
import { OrderInvoicesController } from './order-invoices.controller';
import { Order } from '../orders/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderInvoice, Order])],
  controllers: [OrderInvoicesController],
  providers: [OrderInvoicesService],
  exports: [OrderInvoicesService],
})
export class OrderInvoicesModule {}
