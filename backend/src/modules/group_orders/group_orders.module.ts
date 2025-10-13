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

@Module({
  imports: [TypeOrmModule.forFeature([GroupOrder, GroupOrderMember, GroupOrderItem, Order, Store, Product, Variant,PricingRules])],
  controllers: [GroupOrdersController, GroupOrderItemsController],
  providers: [GroupOrdersService, GroupOrderItemsService],
  exports: [GroupOrdersService],
})
export class GroupOrdersModule {}  
