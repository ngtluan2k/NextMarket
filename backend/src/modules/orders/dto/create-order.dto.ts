import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
} from 'class-validator';
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

  @IsEnum(['bulk', 'subscription', 'normal', 'flash_sale'])
  type!: 'bulk' | 'subscription' | 'normal' | 'flash_sale'; 
  
  @IsOptional()
  @IsNumber()
  pricingRuleId?: number;// ✅ thêm field này
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
