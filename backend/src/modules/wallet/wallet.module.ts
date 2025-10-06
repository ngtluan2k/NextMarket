// wallet.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet])], // 👈 QUAN TRỌNG
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService], // nếu chỗ khác cũng cần WalletService
})
export class WalletModule {}
