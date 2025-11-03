import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class RegisterFlashSaleDto {
  @IsNumber()
  @IsOptional()
  schedule_id?: number;

  @IsArray()
  @IsNotEmpty()
  product_variant_ids!: { product_id: number; variant_id?: number; price?: number; limit_quantity?: number }[];
}
