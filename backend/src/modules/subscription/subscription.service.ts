import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Subscription } from './subscription.entity';
import { SubscriptionUsage } from '../subscription_usages/subscription_usage.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { User } from '../user/user.entity';
import { UserAddress } from '../user_address/user_address.entity';
import { Store } from '../store/store.entity';
import { OrderStatuses } from '../orders/types/orders';
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,

    @InjectRepository(SubscriptionUsage)
    private readonly usageRepo: Repository<SubscriptionUsage>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,

    private readonly dataSource: DataSource
  ) {}

  async useSubscriptionToCreateOrder(
    userId: number,
    subscriptionId: number,
    usedQuantity = 1,
    addressId: number,
    note?: string
  ) {
    return this.dataSource.transaction(async (manager) => {
      const subRepo = manager.getRepository(Subscription);
      const usageRepo = manager.getRepository(SubscriptionUsage);
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);

      const subscription = await subRepo.findOne({
        where: { id: subscriptionId, user: { id: userId } },
        relations: ['user', 'product', 'variant', 'product.store'],
      });

      if (!subscription) throw new Error('Subscription not found');
      if (subscription.status !== 'active')
        throw new Error('Subscription is not active');
      if (subscription.remainingQuantity < usedQuantity)
        throw new Error('Not enough remaining quantity');

      // Kiểm tra hết hạn
      const now = new Date();
      if (subscription.endDate && subscription.endDate < now) {
        subscription.status = 'expired';
        await subRepo.save(subscription);
        throw new Error('Subscription has expired');
      }
      if (!subscription.product) {
        throw new Error('Subscription has no product linked');
      }
      // ✅ Tạo order 0đ
      const order = orderRepo.create({
        user: subscription.user,
        store: subscription.product.store as Store,
        userAddress: { id: addressId } as UserAddress,
        subtotal: 0,
        shippingFee: 0,
        discountTotal: 0,
        totalAmount: 0,
        currency: 'VND',
        status: OrderStatuses.confirmed, // hoặc pending nếu cần duyệt
      });

      await orderRepo.save(order);

      // ✅ Tạo order item (0đ)
      const orderItem = orderItemRepo.create({
        order,
        product: subscription.product ?? undefined,
        variant: subscription.variant,
        quantity: usedQuantity,
        price: 0,
        subtotal: 0,
      });

      await orderItemRepo.save(orderItem);

      // ✅ Trừ remainingQuantity
      subscription.remainingQuantity -= usedQuantity;
      await subRepo.save(subscription);

      // ✅ Ghi log usage
      const usage = usageRepo.create({
        subscription,
        order,
        usedQuantity,
        note,
      });
      await usageRepo.save(usage);

      return {
        message: 'Subscription usage and order created successfully',
        orderUuid: order.uuid,
        remaining: subscription.remainingQuantity,
      };
    });
  }

  async getUserSubscriptions(userId: number): Promise<Subscription[]> {
    return this.subRepo.find({
      where: { user: { id: userId } },
      relations: ['product', 'variant', 'product.store', 'product.media'],
      order: { endDate: 'ASC' },
    });
  }

  // subscription.service.ts
async getStoreSubscriptionsById(storeId: number) {
  return this.subRepo.find({
    where: { product: { store: { id: storeId } } },
    relations: ['product', 'variant', 'user', 'user.profile','product.store', 'product.media'],
    order: { endDate: 'ASC' },
  });
}
}
