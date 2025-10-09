import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './apply-voucher.dto';

export class CalculateDiscountDto {
  @IsArray()
  @IsString({ each: true })
  voucherCodes!: string[];

  @IsNumber()
  userId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems!: OrderItemDto[];

  @IsNumber()
  storeId!: number;

  @IsNumber()
  orderAmount!: number;
}
