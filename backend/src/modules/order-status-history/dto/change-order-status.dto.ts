// change-order-status.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class ChangeOrderStatusDto {
  @IsOptional()
  @IsString()
  note?: string;
}
