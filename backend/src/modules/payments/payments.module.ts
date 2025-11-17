import { Module,forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { PaymentTransaction } from '../payment-transactions/payment-transaction.entity';
import { Refund } from '../refunds/refund.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsWebhookController } from './webhook.controller';
import { CodStrategy } from './strategies/cod.strategy';
import { VnpayStrategy } from './strategies/vnpay.strategy';
import { MomoStrategy } from './strategies/momo.strategy';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { Variant } from '../variant/variant.entity';
import { Inventory } from '../inventory/inventory.entity';
import { OrderStatusHistory } from '../order-status-history/order-status-history.entity';
import { EveryCoinStrategy } from './strategies/everycoin.strategy';
import { GroupOrderMember } from '../group_orders_members/group_orders_member.entity';
import { GroupOrdersModule } from '../group_orders/group_orders.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentMethod,
      PaymentTransaction,
      Refund,
      Order,
      OrderItem,
      Variant,
      Inventory,
      OrderStatusHistory,
      GroupOrderMember, 
    ]),
     forwardRef(() => GroupOrdersModule),
  ],
  providers: [
    PaymentsService,
    CodStrategy,
    VnpayStrategy,
    MomoStrategy,
    EveryCoinStrategy,
  ],
  controllers: [PaymentsController, PaymentsWebhookController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
