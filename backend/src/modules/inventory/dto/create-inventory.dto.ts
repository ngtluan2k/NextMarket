import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsNumber()
  productId!: number;

  @IsOptional()
  @IsNumber()
  variantId?: number| null;;

  @IsString()
  location!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  reserved_stock!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  used_quantity?: number;
}