import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateProductReviewDto {
  @IsInt()
  orderId!: number;

  @IsInt()
  productId!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
