import { IsNumber, IsOptional, IsPositive, IsUUID, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  userId!: number;

  @IsNumber()
  storeId!: number;

  @IsNumber()
  addressId!: number;

  @IsNumber()
  @IsPositive()
  totalAmount!: number;

  @IsNumber()
  @IsOptional()
  shippingFee?: number;

  @IsNumber()
  @IsOptional()
  discountTotal?: number;

  @IsString()
  @IsOptional()
  currency?: string = 'VND';
}
