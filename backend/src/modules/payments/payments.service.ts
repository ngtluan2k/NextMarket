import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import {
  PaymentTransaction,
  PaymentTransactionStatus,
} from '../payment-transactions/payment-transaction.entity';
import { Refund } from '../refunds/refund.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { Variant } from '../variant/variant.entity';
import { Inventory } from '../inventory/inventory.entity';
import {
  historyStatus,
  OrderStatusHistory,
} from '../order-status-history/order-status-history.entity';
import { CodStrategy } from './strategies/cod.strategy';
import { VnpayStrategy } from './strategies/vnpay.strategy';
import { MomoStrategy } from './strategies/momo.strategy';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(PaymentMethod)
    private methodsRepo: Repository<PaymentMethod>,
    @InjectRepository(PaymentTransaction)
    private txRepo: Repository<PaymentTransaction>,
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
    @InjectRepository(Order) private ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Variant) private variantsRepo: Repository<Variant>,
    @InjectRepository(Inventory) private inventoryRepo: Repository<Inventory>,
    @InjectRepository(OrderStatusHistory)
    private historyRepo: Repository<OrderStatusHistory>,
    private codStrategy: CodStrategy,
    private vnpayStrategy: VnpayStrategy,
    private momoStrategy: MomoStrategy
  ) {}

  async create(dto: CreatePaymentDto) {
    const order = await this.ordersRepo.findOne({
      where: { uuid: dto.orderUuid },
      relations: ['orderItem', 'orderItem.variant', 'orderItem.product'],
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 1) {
      throw new ConflictException('Order already paid');
    }

    const method = await this.methodsRepo.findOne({
      where: { uuid: dto.paymentMethodUuid },
    });
    if (!method) throw new BadRequestException('Invalid payment method');

    const strategyType = method?.type || 'cod';

    let result;
    switch (strategyType) {
      case 'cod':
        result = await this.codStrategy.createPayment(order, method);
        break;
      case 'vnpay':
        result = await this.vnpayStrategy.createPayment(order, method);
        break;
      case 'momo':
        result = await this.momoStrategy.createPayment(order, method);
        break;
      default:
        throw new BadRequestException('Unsupported payment method type');
    }

    return result;
  }

  async findByOrder(orderUuid: string) {
    const order = await this.ordersRepo.findOne({
      where: { uuid: orderUuid },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payments = await this.paymentsRepo.find({
      where: { order: { id: order.id } },
      relations: ['paymentMethod', 'order'],
    });

    return payments;
  }

  async handleProviderCallback({
    paymentUuid,
    providerTransactionId,
    success,
    rawPayload,
  }: {
    paymentUuid: string;
    providerTransactionId: string;
    success: boolean;
    rawPayload?: any;
  }) {
    return this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { uuid: paymentUuid },
        relations: ['order', 'paymentMethod'],
      });
      if (!payment) throw new NotFoundException('Payment not found');

      const existingTx = await manager.findOne(PaymentTransaction, {
        where: { providerTransactionId },
      });
      if (existingTx) {
        this.logger.warn(
          'Duplicate provider transaction id: ' + providerTransactionId
        );
        return payment;
      }

      const tx = manager.create(PaymentTransaction, {
        payment,
        providerTransactionId,
        amount: payment.amount,
        status: success
          ? PaymentTransactionStatus.Success
          : PaymentTransactionStatus.Failed,
      });
      await manager.save(tx);

      if (!success) {
        payment.status = PaymentStatus.Failed;
        await manager.save(payment);
        return payment;
      }

      payment.status = PaymentStatus.Completed;
      payment.transactionId = providerTransactionId;
      payment.paidAt = new Date();
      payment.rawPayload =
        typeof rawPayload === 'string'
          ? rawPayload
          : JSON.stringify(rawPayload || {});
      await manager.save(payment);

      const order = payment.order;
      const oldStatus = order.status;
      order.status = 1;
      await manager.save(order);

      const history = manager.create(OrderStatusHistory, {
        order: order as Order,
        oldStatus: oldStatus as unknown as historyStatus,
        newStatus: order.status as unknown as historyStatus,
        changedAt: new Date(),
        note: 'Payment completed via provider',
      });
      await manager.save(history);

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
          inv.reserved_stock = (inv.reserved_stock || 0) - item.quantity;
          if (inv.reserved_stock < 0) {
            throw new BadRequestException('Reserved stock cannot be negative');
          }
          await manager.save(inv);
        }
      }

      return payment;
    });
  }
}