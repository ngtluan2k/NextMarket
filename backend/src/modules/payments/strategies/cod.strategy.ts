import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../payment.entity';
import { Order } from '../../orders/order.entity';
import { PaymentMethod } from '../../payment-methods/payment-method.entity';
import {
  historyStatus,
  OrderStatusHistory,
} from '../../order-status-history/order-status-history.entity';
import { OrderItem } from '../../order-items/order-item.entity';
import { Variant } from '../../variant/variant.entity';
import { Inventory } from '../../inventory/inventory.entity';
import { OrderStatuses } from '../../orders/types/orders';
import { CommissionCalcService } from '../../affiliate-commissions/service/commission-calc.service';

@Injectable()
export class CodStrategy {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private historyRepo: Repository<OrderStatusHistory>,
    @InjectRepository(OrderItem) private orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Variant) private variantsRepo: Repository<Variant>,
    @InjectRepository(Inventory) private inventoryRepo: Repository<Inventory>,
    private commissionCalcService: CommissionCalcService
  ) {}

  async createPayment(order: Order, paymentMethod: PaymentMethod,isGroup: boolean = false) {
    return this.paymentRepo.manager.transaction(async (manager) => {
      // Tạo bản ghi thanh toán
      const payment = manager.create(Payment, {
        order,
        paymentMethod,
        amount: order.totalAmount,
        status: PaymentStatus.Paid, // ✅ Set to Paid for testing
        paidAt: new Date(),
        isGroup,
      });
      await manager.save(payment);

      // ✅ FOR TESTING: Automatically set order to COMPLETED to trigger affiliate commissions
      const oldStatus = order.status;
      order.status = OrderStatuses.completed; // Status = 5 (completed)
      const updatedOrder = await manager.save(order);

      // Tạo lịch sử trạng thái đơn hàng
      const history = manager.create(OrderStatusHistory, {
        order,
        oldStatus: oldStatus as unknown as historyStatus,
        newStatus: OrderStatuses.completed as unknown as historyStatus,
        changedAt: new Date(),
        note: '🧪 TEST MODE: COD payment auto-completed for affiliate commission testing',
      });
      await manager.save(history);

      console.log(`🧪 TEST MODE: Order ${order.id} auto-completed via COD`);

      // ✅ Trigger affiliate commission calculation immediately
      if ((order as any).affiliate_user_id) {
        try {
          console.log(`🎯 Triggering affiliate commission for order ${order.id}`);
          // Use setTimeout to run after transaction commits
          setTimeout(async () => {
            try {
              await this.commissionCalcService.handleOrderPaid(order.id);
              console.log(`✅ Affiliate commission calculated for order ${order.id}`);
            } catch (error) {
              console.error(`❌ Commission calculation failed for order ${order.id}:`, error);
            }
          }, 1000);
        } catch (error) {
          console.error(`❌ Failed to trigger commission:`, error);
        }
      }

      // Cập nhật kho hàng
      // const items: OrderItem[] = await manager.find(OrderItem, {
      //   where: { order: { id: order.id } },
      //   relations: ['variant', 'product'],
      // });
      // for (const item of items) {
      //   if (item.variant) {
      //     item.variant.stock = (item.variant.stock || 0) - item.quantity;
      //     await manager.save(item.variant);
      //   }
      //   const inv = await manager.findOne(Inventory, {
      //     where: {
      //       product: { id: item.product.id },
      //       variant: item.variant ? { id: item.variant.id } : IsNull(),
      //     },
      //   });
      //   if (inv) {
      //     inv.used_quantity = (inv.used_quantity || 0) - item.quantity;
      //     inv.quantity = (inv.quantity || 0) - item.quantity;
      //     await manager.save(inv);
      //   }
      // }

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
    return null; // COD không cần callback
  }
}
