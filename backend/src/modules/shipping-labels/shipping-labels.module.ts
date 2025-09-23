import { Module } from '@nestjs/common';
import { ShippingLabelsService } from './shipping-labels.service';
import { ShippingLabelsController } from './shipping-labels.controller';

@Module({
  controllers: [ShippingLabelsController],
  providers: [ShippingLabelsService],
})
export class ShippingLabelsModule {}
