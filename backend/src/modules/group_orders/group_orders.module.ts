// backend/src/modules/group_orders/group_orders.module.ts
// group-order.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupOrder } from './group_orders.entity';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { GroupOrderItem } from '../group_orders_items/group_orders_item.entity';
import { GroupOrdersService } from './group_orders.service';
import { Order } from '../orders/order.entity';
import { GroupOrdersController } from './group_orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GroupOrder, GroupOrderMember, GroupOrderItem, Order])],
  controllers: [GroupOrdersController],
  providers: [GroupOrdersService],
  exports: [GroupOrdersService],
})
export class GroupOrdersModule {}