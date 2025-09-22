import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateOrderInvoiceDto {
  @IsNotEmpty()
  orderId!: number;

  @IsNotEmpty()
  @IsString()
  invoiceNumber!: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsNumber()
  totalTax?: number;
}
