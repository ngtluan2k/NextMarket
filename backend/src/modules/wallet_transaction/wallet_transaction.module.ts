import { Module } from '@nestjs/common';
import { WalletTransactionService } from './wallet_transaction.service';
import { WalletTransactionController } from './wallet_transaction.controller';

@Module({
  controllers: [WalletTransactionController],
  providers: [WalletTransactionService],
})
export class WalletTransactionModule {}
