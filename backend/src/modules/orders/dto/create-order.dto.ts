import { IsNumber, IsString, IsArray, ValidateNested, IsOptional} from 'class-validator';
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
  @IsNumber()
  userId!: number;

  @IsNumber()
  storeId!: number;

  @IsNumber()
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