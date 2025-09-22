import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatuses } from '../order.entity';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsEnum(OrderStatuses)
  @IsOptional()
  status?: OrderStatuses;
}
