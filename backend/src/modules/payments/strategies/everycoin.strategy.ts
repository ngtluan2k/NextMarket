import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../payment.entity';
import { Order } from '../../orders/order.entity';
import { PaymentMethod } from '../../payment-methods/payment-method.entity';
import {
  OrderStatusHistory,
  historyStatus,
} from '../../order-status-history/order-status-history.entity';

@Injectable()
export class EveryCoinStrategy {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private historyRepo: Repository<OrderStatusHistory>
  ) {}

  async createPayment(order: Order, paymentMethod: PaymentMethod,isGroup: boolean = false) {
    return this.paymentRepo.manager.transaction(async (manager) => {
      // Tạo bản ghi thanh toán
      const payment = manager.create(Payment, {
        order,
        paymentMethod,
        amount: order.totalAmount,
        status: PaymentStatus.Paid, // trực tiếp success
        paidAt: new Date(),
        isGroup,
      });
      await manager.save(payment);

      // Cập nhật trạng thái đơn hàng
      const oldStatus = order.status;
      order.status = 0; // pending
      await manager.save(order);

      // Tạo lịch sử trạng thái đơn hàng
      const history = manager.create(OrderStatusHistory, {
        order,
        oldStatus: oldStatus as unknown as historyStatus,
        newStatus: order.status as unknown as historyStatus,
        changedAt: new Date(),
        note: 'Payment completed via EveryCoin',
      });
      await manager.save(history);

      // ✅ Reload payment with full relations including orderItem.subtotal
      // Use query builder to explicitly select all columns including nullable ones
      const paymentWithOrder = await manager
        .createQueryBuilder(Payment, 'payment')
        .leftJoinAndSelect('payment.order', 'order')
        .leftJoinAndSelect('order.orderItem', 'orderItem')
        .leftJoinAndSelect('orderItem.product', 'product')
        .leftJoinAndSelect('orderItem.variant', 'variant')
        .leftJoinAndSelect('order.group_order', 'group_order')
        .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
        .addSelect([
          'orderItem.id',
          'orderItem.uuid',
          'orderItem.quantity',
          'orderItem.price',
          'orderItem.discount',
          'orderItem.subtotal', // ✅ Explicitly select subtotal
          'orderItem.note',
        ])
        .where('payment.id = :id', { id: payment.id })
        .getOne();

      return paymentWithOrder || payment;
    });
  }

  async handleCallback(payload: any) {
    return null; // không cần callback
  }
}
