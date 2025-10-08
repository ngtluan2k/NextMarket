import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class OrderItemDto {
  @IsNumber()
  productId!: number;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  price!: number;
}

export class ApplyVoucherDto {
  @IsString()
  code!: string;

  @IsNumber()
  storeId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems!: OrderItemDto[];
}
