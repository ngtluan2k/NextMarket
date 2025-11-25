import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutGroupOrderDto {
  @IsString()
  @IsUUID(undefined, { message: 'paymentMethodUuid phải là UUID hợp lệ' })
  paymentMethodUuid!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'addressId phải là số' })
  addressId?: number;


  @ApiPropertyOptional({
    description: 'Mã voucher (chỉ cho phép PLATFORM hoặc STORE)',
    example: 'NEWYEAR2025'
  })
  @IsOptional()
  @IsString()
  voucherCode?: string;
}
