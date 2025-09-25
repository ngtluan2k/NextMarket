import { IsString, IsOptional } from 'class-validator';

export class PaymentCallbackDto {
  @IsString()
  orderId!: string;

  @IsString()
  providerTransactionId!: string;

  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  raw?: string;
}
