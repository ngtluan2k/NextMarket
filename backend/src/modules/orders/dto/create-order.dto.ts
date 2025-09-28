import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
  IsArray,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemInput {
  @IsInt()
  @Type(() => Number)
  productId!: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  variantId?: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsPositive()
  @Type(() => Number)
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

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  totalAmount!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shippingFee?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discountTotal?: number;

  @IsString()
  @IsOptional()
  currency?: string = 'VND';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemInput)
  items!: CreateOrderItemInput[];
}
