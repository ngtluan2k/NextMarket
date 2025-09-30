import { IsNumber, IsString, IsArray, ValidateNested, IsOptional, IsInt} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNumber()
  productId!: number;

  @IsOptional()
  @IsNumber()
  variantId?: number;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  price!: number;
}

export class CreateOrderDto {
  @IsInt()
  @Type(() => Number)
  userId!: number;

  @IsInt()
  @Type(() => Number)
  storeId!: number;

  @IsInt()
  @Type(() => Number)
  addressId!: number;

  @IsOptional()
  @IsNumber()
  shippingFee?: number;

  @IsOptional()
  @IsNumber()
  discountTotal?: number;

  @IsNumber()
  totalAmount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  voucherCodes?: string[];
}
