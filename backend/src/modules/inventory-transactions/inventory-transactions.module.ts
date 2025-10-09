import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryTransaction } from './inventory-transaction.entity';
import { Variant } from '../variant/variant.entity';
import { Inventory } from '../inventory/inventory.entity';
import { User } from '../user/user.entity';
import { InventoryTransactionService } from './inventory-transactions.service';
import { InventoryTransactionController } from './inventory-transactions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryTransaction, Variant, Inventory, User]),
  ],
  controllers: [InventoryTransactionController],
  providers: [InventoryTransactionService],
  exports: [InventoryTransactionService],
})
export class InventoryTransactionModule {}
