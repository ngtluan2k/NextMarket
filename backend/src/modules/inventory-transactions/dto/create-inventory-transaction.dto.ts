import { IsNumber, IsString, IsOptional, Min, IsEnum } from 'class-validator';
import { TransactionType } from '../inventory-transaction.entity';

export class CreateInventoryTransactionDto {
  @IsNumber()
  variantId!: number;

  @IsNumber()
  inventoryId!: number;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsEnum(TransactionType)
  transactionType!: TransactionType;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  createdBy?: number;
}
