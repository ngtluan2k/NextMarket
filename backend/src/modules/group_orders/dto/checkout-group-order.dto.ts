import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutGroupOrderDto {
  @IsString()
  @IsUUID(undefined, { message: 'paymentMethodUuid phải là UUID hợp lệ' })
  paymentMethodUuid!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'addressId phải là số' })
  addressId?: number;
}
