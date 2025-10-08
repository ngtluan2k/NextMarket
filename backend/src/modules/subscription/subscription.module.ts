import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { SubscriptionUsage } from '../subscription_usages/subscription_usage.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../order-items/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      PricingRules,
      SubscriptionUsage,
      Order,
      OrderItem,
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
