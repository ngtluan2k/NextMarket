import { PartialType } from '@nestjs/swagger';
import { CreateOrderShipmentDto } from './create-order-shipment.dto';

export class UpdateOrderShipmentDto extends PartialType(
  CreateOrderShipmentDto
) {}
