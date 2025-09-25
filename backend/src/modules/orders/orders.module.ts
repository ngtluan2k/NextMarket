  import { Module } from '@nestjs/common';
  import { OrdersService } from './orders.service';
  import { OrdersController } from './orders.controller';
  import { TypeOrmModule } from '@nestjs/typeorm';
  import { User } from '../user/user.entity';
  import { Store } from '../store/store.entity';
  import { Order } from '../orders/order.entity';
  import { UserAddress } from '../user_address/user_address.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { Inventory } from '../inventory/inventory.entity';

  @Module({
    imports: [
      TypeOrmModule.forFeature([
        Order,
        User,
        Store,
        UserAddress,
        OrderItem,
        Inventory
      ]),
    ],
    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService],
  })
  export class OrdersModule {}