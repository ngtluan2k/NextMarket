import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateVoucherDto {
  @ApiProperty({ description: 'Mã voucher', example: 'DISCOUNT10' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Số tiền đơn hàng', example: 150000 })
  @IsNumber()
  order_amount!: number;

  @ApiProperty({ description: 'ID cửa hàng', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  store_id?: number;
}