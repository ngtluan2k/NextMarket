import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsNumber()
  productId!: number;

  @IsNumber()
  variantId!: number;

  @IsString()
  location!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  used_quantity?: number;
}