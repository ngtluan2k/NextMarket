import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../payment.entity';
import { Order } from '../../orders/order.entity';
import { PaymentMethod } from '../../payment-methods/payment-method.entity';
import { historyStatus, OrderStatusHistory } from '../../order-status-history/order-status-history.entity';
import { OrderItem } from '../../order-items/order-item.entity';
import { Variant } from '../../variant/variant.entity';
import { Inventory } from '../../inventory/inventory.entity';

@Injectable()
export class CodStrategy {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    @InjectRepository(OrderStatusHistory) private historyRepo: Repository<OrderStatusHistory>,
    @InjectRepository(OrderItem) private orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Variant) private variantsRepo: Repository<Variant>,
    @InjectRepository(Inventory) private inventoryRepo: Repository<Inventory>,
  ) {}

  async createPayment(order: Order, paymentMethod: PaymentMethod) {
    return this.paymentRepo.manager.transaction(async (manager) => {
      // Tạo bản ghi thanh toán
      const payment = manager.create(Payment, {
        order,
        paymentMethod,
        amount: order.totalAmount,
        status: PaymentStatus.Completed, // Đặt trạng thái thành công
        paidAt: new Date(),
      });
      await manager.save(payment);

      // Cập nhật trạng thái đơn hàng
      const oldStatus = order.status;
      order.status = 0; // Đặt trạng thái đơn hàng là "Đã thanh toán"
      await manager.save(order);

      // Tạo lịch sử trạng thái đơn hàng
      const history = manager.create(OrderStatusHistory, {
        order,
        oldStatus: oldStatus as unknown as historyStatus,
        newStatus: order.status as unknown as historyStatus,
        changedAt: new Date(),
        note: 'Payment completed via COD',
      });
      await manager.save(history);

      // Cập nhật kho hàng
      const items: OrderItem[] = await manager.find(OrderItem, {
        where: { order: { id: order.id } },
        relations: ['variant', 'product'],
      });
      for (const item of items) {
        if (item.variant) {
          item.variant.stock = (item.variant.stock || 0) - item.quantity;
          await manager.save(item.variant);
        }
        const inv = await manager.findOne(Inventory, {
          where: {
            product: { id: item.product.id },
            variant: item.variant ? { id: item.variant.id } : IsNull(),
          },
        });
        if (inv) {
          inv.quantity = (inv.quantity || 0) - item.quantity;
          inv.used_quantity = (inv.used_quantity || 0) + item.quantity;
          await manager.save(inv);
        }
      }

      return payment;
    });
  }

  async handleCallback(payload: any) {
    return null; // COD không cần callback
  }
}