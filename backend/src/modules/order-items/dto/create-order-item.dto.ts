import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber()
  orderId!: number;

  @IsNumber()
  productId!: number;

  @IsNumber()
  @IsOptional()
  variantId?: number;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsNumber()
  @IsOptional()
  subtotal?: number;
}
