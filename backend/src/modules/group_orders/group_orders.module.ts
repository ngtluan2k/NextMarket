import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupOrder } from './../group_orders/group_orders.entity';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { GroupOrderItem } from '../group_orders_items/group_orders_item.entity';
import { GroupOrdersService } from './../group_orders/group_orders.service';
import { Order } from '../orders/order.entity';
import { GroupOrdersController } from './../group_orders/group_orders.controller';
import { Store } from '../store/store.entity';
import { GroupOrderItemsController } from '../group_orders_items/group_orders_items.controller';
import { GroupOrderItemsService } from '../group_orders_items/group_orders_items.service';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { GroupOrdersGateway } from './group_orders.gateway';
import { Inventory } from '../inventory/inventory.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { PaymentsModule } from '../payments/payments.module';
import { UserAddress } from '../user_address/user_address.entity';
import { User } from '../user/user.entity';
import { OrderStatusHistory } from '../order-status-history/order-status-history.entity';
import { AffiliateLinksModule } from '../affiliate-links/affiliate-links.module';
import { AffiliateCommissionsModule } from '../affiliate-commissions/affiliate-commissions.module';
import { Referral } from '../referral/referrals.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupOrder, GroupOrderMember, GroupOrderItem, Order, Store, Product, Variant,PricingRules, Inventory,OrderItem,UserAddress,User,OrderStatusHistory,Referral]),
    PaymentsModule,
    AffiliateLinksModule,
    AffiliateCommissionsModule
  ],
  controllers: [GroupOrdersController, GroupOrderItemsController],
  providers: [GroupOrdersService, GroupOrderItemsService,GroupOrdersGateway],
  exports: [GroupOrdersService,GroupOrdersGateway],
})
export class GroupOrdersModule {}  
