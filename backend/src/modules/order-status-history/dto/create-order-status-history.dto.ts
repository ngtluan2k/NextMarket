import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { historyStatus } from '../../order-status-history/order-status-history.entity'

export class CreateOrderStatusHistoryDto {
  @IsInt()
  @IsNotEmpty()
  orderId!: number; 

  @IsInt()
  @IsNotEmpty()
  oldStatus!: historyStatus;

  @IsInt()
  @IsNotEmpty()
  newStatus!: historyStatus;

  @IsInt()
  @IsOptional()
  changedById?: number; 

  @IsString()
  @IsOptional()
  note?: string;
}
