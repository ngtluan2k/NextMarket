// src/modules/product/dto/create-product.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  base_price!: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsNotEmpty()
  @IsNumber()
  brandId!: number;

  @IsNotEmpty()
  @IsNumber()
  categoryId!: number;
}
