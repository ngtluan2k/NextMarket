import { ApiProperty } from '@nestjs/swagger';

export class MediaDto {
  @ApiProperty({ description: 'URL of the media' })
  url?: string;
}

export class VariantDto {
  @ApiProperty({ description: 'Variant ID' })
  id?: number;

  @ApiProperty({ description: 'Name of the variant (e.g., 512GB - Gold)' })
  variant_name?: string;

  @ApiProperty({ description: 'Price of the variant' })
  price?: number;

  @ApiProperty({ description: 'Stock quantity' })
  stock?: number;
}

export class InventoryDto {
  @ApiProperty({ description: 'Inventory ID' })
  id?: number;

  @ApiProperty({ description: 'Variant SKU' })
  variant_sku?: string;

  @ApiProperty({ description: 'Location of inventory' })
  location?: string;

  @ApiProperty({ description: 'Quantity available' })
  quantity?: number;

  @ApiProperty({ description: 'Quantity already used' })
  used_quantity?: number;
}


export class BrandDto {
  @ApiProperty({ description: 'Brand id' })
  id?: number;
  @ApiProperty({ description: 'Brand name' })
  name?: string;
}

export class CategoryDto {
  @ApiProperty({ description: 'Category name' })
  name?: string;
}

export class PricingRuleDto {
  @ApiProperty({ description: 'Type of pricing rule (e.g., bulk)' })
  type?: string;

  @ApiProperty({ description: 'Minimum quantity for the rule' })
  min_quantity?: number;

  @ApiProperty({ description: 'Price applied by the rule' })
  price?: number;
}

export class StoreDto {
  @ApiProperty({ description: 'Store ID' })
  id?: number;

  @ApiProperty({ description: 'Store name' })
  name?: string;

  @ApiProperty({ description: 'Store slug' })
  slug?: string;
  @ApiProperty({ description: 'Store logo URL' })
  logo_url?: string;
}


export class ProductResponseDto {
  @ApiProperty({ description: 'Product ID' })
  id?: number;

  @ApiProperty({ description: 'Product name' })
  name?: string;

  @ApiProperty({ description: 'Product slug' })
  slug?: string;

  @ApiProperty({ description: 'Short description' })
  short_description?: string;

  @ApiProperty({ description: ' description' })
  description?: string;

  @ApiProperty({ description: 'status' })
  status?: string;

  @ApiProperty({ description: 'Base price of the product' })
  base_price?: number;

  @ApiProperty({
    type: [MediaDto],
    description: 'Product media (images/videos)',
  })
  media?: MediaDto[];

  @ApiProperty({ type: [VariantDto], description: 'Product variants' })
  variants?: VariantDto[];

   @ApiProperty({
  description: 'Inventories mapped by variant SKU',
  type: Object, // object map
})
inventories?: Record<string, InventoryDto[]>;


  @ApiProperty({ type: BrandDto, description: 'Brand information' })
  brand?: BrandDto;

  @ApiProperty({ type: [CategoryDto], description: 'Product categories' })
  categories?: CategoryDto[];

  @ApiProperty({ type: [PricingRuleDto], description: 'Pricing rules' })
  pricing_rules?: PricingRuleDto[];

  @ApiProperty({ type: StoreDto, description: 'Store information' })
  store?: StoreDto;

  @ApiProperty({
    description: 'Start date of the pricing rule',
    type: Date,
    required: false,
  })
  starts_at?: Date;

  @ApiProperty({
    description: 'End date of the pricing rule',
    type: Date,
    required: false,
  })
  ends_at?: Date;
}
