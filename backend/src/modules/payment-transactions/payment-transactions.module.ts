import { Module } from '@nestjs/common';
import { PaymentTransactionsService } from './payment-transactions.service';
import { PaymentTransactionsController } from './payment-transactions.controller';

@Module({
  controllers: [PaymentTransactionsController],
  providers: [PaymentTransactionsService],
})
export class PaymentTransactionsModule {}
