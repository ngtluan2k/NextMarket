import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  orderUuid!: string;

  @IsUUID()
  @IsOptional()
  paymentMethodUuid!: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsOptional()
  rawPayload?: string;

  @IsOptional()
  isGroup?: boolean;
}
