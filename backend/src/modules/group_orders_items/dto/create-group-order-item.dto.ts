import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateGroupOrderItemDto {

  @IsInt()
  @Min(1)
  productId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  variantId?: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Ghi chú không được vượt quá 255 ký tự' })
  note?: string;
}
