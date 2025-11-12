import { Module } from '@nestjs/common';
import { VoucherCollectionService } from './voucher-collection.service';
import { VoucherCollectionController } from './voucher-collection.controller';

@Module({
  controllers: [VoucherCollectionController],
  providers: [VoucherCollectionService],
})
export class VoucherCollectionModule {}
