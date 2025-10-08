// create-product.dto.ts
import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  short_description?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  base_price!: number;

  @IsNumber()
  storeId!: number;

  @IsNumber()
  @IsOptional()
  brandId!: number;

  @IsArray()
  @IsOptional()
  categories?: number[];

  @IsArray()
  @IsOptional()
  media?: {
    media_type: string;
    url: string;
    is_primary?: boolean;
    sort_order?: number;
  }[];

  @IsArray()
  @IsOptional()
  variants?: {
    sku: string;
    variant_name: string;
    price: number;
    stock: number;
    barcode?: string;
  }[];

  @IsArray()
  @IsOptional()
  inventory?: {
    variant_sku: string;
    location: string;
    quantity: number;
    used_quantity?: number;
  }[];

  @IsArray()
  @IsOptional()
  pricing_rules?: {
    type: string;
    min_quantity: number;
    price: number;
    cycle?: string;
    starts_at?: string | Date;
    ends_at?: string | Date;

    // các trường mới
    variant_sku?: string; // dùng sku để liên kết với variant
    name?: string; // tên rule
    status?: 'active' | 'inactive'; // trạng thái
  }[];
}
