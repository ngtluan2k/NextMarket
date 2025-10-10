import {
  IsEnum,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  VoucherType,
  VoucherDiscountType,
  VoucherStatus,
  VoucherCollectionType,
} from '../vouchers.entity';

class TimeRestrictionDto {
  @IsOptional()
  @IsArray()
  days_of_week?: number[];

  @IsOptional()
  @IsArray()
  hours?: { start: string; end: string }[];
}

class UserConditionDto {
  @IsOptional()
  @IsNumber()
  min_orders?: number;

  @IsOptional()
  @IsArray()
  vip_level?: string[];

  @IsOptional()
  @IsArray()
  user_tags?: string[];
}

export class CreateVoucherDto {
  @IsString()
  code!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsNumber()
  store?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(VoucherType)
  type?: VoucherType;

  @IsEnum(VoucherDiscountType)
  discount_type!: VoucherDiscountType;

  @IsNumber()
  discount_value!: number;

  @IsOptional()
  @IsNumber()
  max_discount_amount?: number;

  @IsOptional()
  @IsNumber()
  min_order_amount?: number;

  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;

  @IsOptional()
  @IsNumber()
  total_usage_limit?: number;

  @IsNumber()
  per_user_limit!: number;

  @IsOptional()
  @IsNumber()
  collection_limit?: number;

  @IsEnum(VoucherStatus)
  status!: VoucherStatus;

  @IsEnum(VoucherCollectionType)
  collection_type!: VoucherCollectionType;

  @IsNumber()
  priority!: number;

  @IsBoolean()
  stackable!: boolean;

  @IsBoolean()
  new_user_only!: boolean;

  @IsOptional()
  @IsArray()
  applicable_store_ids?: number[];

  @IsOptional()
  @IsArray()
  applicable_category_ids?: number[];

  @IsOptional()
  @IsArray()
  applicable_product_ids?: number[];

  @IsOptional()
  @IsArray()
  excluded_product_ids?: number[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UserConditionDto)
  user_conditions?: UserConditionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimeRestrictionDto)
  time_restrictions?: TimeRestrictionDto;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsString()
  theme_color?: string;
}
