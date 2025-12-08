import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNumber()
  productId!: number;

  @IsOptional()
  @IsNumber()
  variantId?: number;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsEnum(['bulk', 'subscription', 'normal', 'flash_sale'])
  type!: 'bulk' | 'subscription' | 'normal' | 'flash_sale'; 
  
  @IsOptional()
  @IsNumber()
  pricingRuleId?: number; // ✅ thêm field này

  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number; // ✅ Thêm weight (gram)
}

export class CreateOrderDto {
  @IsNumber()
  userId!: number;

  @IsNumber()
  storeId!: number;

  @IsNumber()
  addressId!: number;

  @IsNumber()
  subtotal!: number;

  @IsNumber()
  shippingFee!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  voucherCodes?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  currency?: string = 'VND';

  // Affiliate tracking fields
  @IsOptional()
  @IsString()
  affiliateCode?: string;

  @IsOptional()
  @IsNumber()
  affiliateUserId?: number;

  @IsOptional()
  @IsNumber()
  affiliateProgramId?: number;
}