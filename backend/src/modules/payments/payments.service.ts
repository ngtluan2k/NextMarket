import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  forwardRef,
  Inject,
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
import { EveryCoinStrategy } from './strategies/everycoin.strategy';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { GroupOrdersService } from '../group_orders/group_orders.service';
import { OrderStatuses } from '../orders/types/orders';

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
    @InjectRepository(GroupOrderMember)
    private groupOrderMemberRepo: Repository<GroupOrderMember>,
    @Inject(forwardRef(() => GroupOrdersService))
    private groupOrdersService: GroupOrdersService,
    private codStrategy: CodStrategy,
    private vnpayStrategy: VnpayStrategy,
    private momoStrategy: MomoStrategy,
    private everycoinStrategy: EveryCoinStrategy
  ) { }

 async create(dto: CreatePaymentDto) {
  this.logger.log(`PaymentsService.create dto=${JSON.stringify(dto)}`);

  const order = await this.ordersRepo.findOne({
    where: { uuid: dto.orderUuid },
    relations: [
      'orderItem',
      'orderItem.variant',
      'orderItem.product',
      'group_order',
      'user',
    ],
  });
  if (!order) throw new NotFoundException('Order not found');

  const method = await this.methodsRepo.findOne({
    where: { uuid: dto.paymentMethodUuid },
  });
  if (!method) throw new BadRequestException('Invalid payment method');

  const isGroupOrder = !!order.group_order;
  const strategyType = method?.type || 'cod';
  this.logger.log(
    `strategyType=${strategyType}, isGroupOrder=${isGroupOrder}, orderId=${order.id}`,
  );

  if (strategyType === 'vnpay' || strategyType === 'momo') {
    if (order.status === OrderStatuses.pending) {
      order.status = OrderStatuses.draft;
      await this.ordersRepo.save(order);
    }
  }

  let result;
  switch (strategyType) {
    case 'cod':
      result = await this.codStrategy.createPayment(order, method, isGroupOrder);
      break;
    case 'vnpay':
      result = await this.vnpayStrategy.createPayment(order, method, isGroupOrder);
      break;
    case 'momo':
      result = await this.momoStrategy.createPayment(order, method, isGroupOrder);
      break;
    case 'everycoin':
      result = await this.everycoinStrategy.createPayment(order, method, isGroupOrder);
      break;
    default:
      throw new BadRequestException('Unsupported payment method type');
  }

  this.logger.log('Finished strategy execution');

  if (strategyType === 'cod' && isGroupOrder && order.group_order && order.user) {
    this.logger.log(
      `COD group order detected: groupId=${order.group_order.id}, userId=${order.user.id}`,
    );

    const hostMember = await this.groupOrderMemberRepo.findOne({
      where: {
        group_order: { id: order.group_order.id } as any,
        user: { id: order.user.id } as any,
      },
      relations: ['user'],
    });

    if (!hostMember) {
      this.logger.warn('Host member not found for COD group order');
    } else {
      const markMemberPaid = async (member: GroupOrderMember) => {
        if (!member.has_paid) {
          member.has_paid = true;
          member.status = 'paid';
          await this.groupOrderMemberRepo.save(member);
          this.logger.log(`Marked member #${member.id} as paid`);
        }
      };

      await markMemberPaid(hostMember);

      if (hostMember.is_host && order.group_order.delivery_mode === 'host_address') {
        const members = await this.groupOrderMemberRepo.find({
          where: { group_order: { id: order.group_order.id } as any },
          relations: ['user'],
        });
        this.logger.log(`Host paid: marking ${members.length} members as paid`);
        for (const member of members) {
          await markMemberPaid(member);
        }
      }

      await this.groupOrdersService.handleMemberPaid(
        order.group_order.id,
        hostMember.user.id,
      );
    }
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
      relations: ['paymentMethod', 'order', 'order.user'],
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
    // Biến để lưu thông tin group order (nếu có)
    let groupOrderId: number | null = null;
    let userId: number | null = null;

    // Thực hiện transaction
    const payment = await this.dataSource.transaction(async (manager) => {
      // 1. Tìm payment với relations cần thiết
      const payment = await manager.findOne(Payment, {
        where: { uuid: paymentUuid },
        relations: ['order', 'order.group_order', 'order.user', 'paymentMethod'],
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      this.logger.log(
        `Processing payment callback: ${paymentUuid}, success: ${success}`
      );

      // 2. Check trùng transaction id (tránh duplicate callback)
      const existingTx = await manager.findOne(PaymentTransaction, {
        where: { providerTransactionId },
      });

      if (existingTx) {
        this.logger.warn(
          `Duplicate provider transaction id: ${providerTransactionId}`
        );
        return payment;
      }

      // 3. Tạo payment transaction record
      const tx = manager.create(PaymentTransaction, {
        payment,
        providerTransactionId,
        amount: payment.amount,
        status: success
          ? PaymentTransactionStatus.Success
          : PaymentTransactionStatus.Failed,
      });
      await manager.save(tx);

      // 4. Nếu payment THẤT BẠI
      if (!success) {
        payment.status = PaymentStatus.Failed;
        await manager.save(payment);

        this.logger.warn(
          `Payment ${paymentUuid} failed: ${providerTransactionId}`
        );

        return payment;
      }

      // 5. Nếu payment THÀNH CÔNG - Update payment
      payment.status = PaymentStatus.Paid;
      payment.transactionId = providerTransactionId;
      payment.paidAt = new Date();
      payment.rawPayload =
        typeof rawPayload === 'string'
          ? rawPayload
          : JSON.stringify(rawPayload || {});
      await manager.save(payment);

      this.logger.log(`✅ Payment ${paymentUuid} marked as paid`);

      // 6. Update order status + tạo history
      const order = payment.order;
      const oldStatus = order.status;

      // Chỉ update order status nếu KHÔNG PHẢI group order waiting_group
      // Vì group order waiting_group sẽ được update khi tất cả members paid
      if (order.status !== -1) {
        if (order.status === OrderStatuses.draft) {
          order.status = OrderStatuses.confirmed; // 1
        } else {
          order.status = 0; // confirmed
        }
        await manager.save(order);

        const history = manager.create(OrderStatusHistory, {
          order: order as Order,
          oldStatus: oldStatus as unknown as historyStatus,
          newStatus: order.status as unknown as historyStatus,
          changedAt: new Date(),
          note: 'Payment completed via provider',
        });
        await manager.save(history);

        this.logger.log(`Order #${order.id} status updated to confirmed`);
      }

      // 7. ✅ Xử lý GROUP ORDER - Update member.has_paid
      if (payment.order.group_order) {
        groupOrderId = payment.order.group_order.id;
        userId = payment.order.user?.id || null;

        this.logger.log(
          `🔍 Processing group order payment - Group #${groupOrderId}, User #${userId}`
        );

        // Tìm member trong group (dùng query builder)
        const member = await manager
          .getRepository(GroupOrderMember)
          .createQueryBuilder('member')
          .where('member.group_order_id = :groupOrderId', { groupOrderId })
          .andWhere('member.user_id = :userId', { userId })
          .getOne();

        if (member) {
          // ✅ CẬP NHẬT has_paid = true, status = 'paid'
          member.has_paid = true;
          member.status = 'paid';
          await manager.save(member);

          this.logger.log(
            `✅ Member #${member.id} marked as paid for group #${groupOrderId}`
          );
        } else {
          this.logger.warn(
            `⚠️ Member not found for group #${groupOrderId}, user #${userId}`
          );
        }
      }

      // 8. Cập nhật tồn kho (nếu cần)
      const items: OrderItem[] = await manager.find(OrderItem, {
        where: { order: { id: order.id } },
        relations: ['variant', 'product'],
      });

      for (const item of items) {
        this.logger.debug(
          `Processing orderItem ${item.id}, product=${item.product.id}, variant=${item.variant?.id || 'none'
          }`
        );

        // Nếu có variant thì trừ stock
        if (item.variant) {
          item.variant.stock = (item.variant.stock || 0) - item.quantity;
          await manager.save(item.variant);

          this.logger.debug(
            `Updated variant #${item.variant.id} stock: ${item.variant.stock}`
          );
        }

        // Tìm và update inventory (nếu cần - code đã comment)
        let inv: Inventory | null = null;

        if (item.variant) {
          inv = await manager.findOne(Inventory, {
            where: {
              product: { id: item.product.id },
              variant: { id: item.variant.id },
            },
            relations: ['product', 'variant'],
          });
        } else {
          inv = await manager.findOne(Inventory, {
            where: {
              product: { id: item.product.id },
              variant: IsNull(),
            },
            relations: ['product'],
          });
        }

        // Có thể uncomment nếu muốn update inventory
        // if (inv) {
        //   inv.used_quantity = (inv.used_quantity || 0) + item.quantity;
        //   inv.quantity = (inv.quantity || 0) - item.quantity;
        //   await manager.save(inv);
        // }
      }

      return payment;
    }); // ← KẾT THÚC TRANSACTION

    // 9. ✅ SAU KHI TRANSACTION COMMIT - Xử lý group order async
    if (success && groupOrderId && userId) {
      try {
        this.logger.log(
          `🔔 Broadcasting member paid event for group #${groupOrderId}`
        );

        // Gọi service để broadcast và check complete group
        await this.groupOrdersService.handleMemberPaid(groupOrderId, userId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `❌ Failed to handle member paid for group #${groupOrderId}: ${errorMessage
          }`
        );
        // Không throw error vì payment đã thành công rồi
        // Chỉ log để debug
      }
    }

    return payment;
  }
}
