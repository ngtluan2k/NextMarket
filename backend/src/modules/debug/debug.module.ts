import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebugController } from './debug.controller';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';
import { WalletTransaction } from '../wallet_transaction/wallet_transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AffiliateCommission, WalletTransaction])
  ],
  controllers: [DebugController],
})
export class DebugModule {}
