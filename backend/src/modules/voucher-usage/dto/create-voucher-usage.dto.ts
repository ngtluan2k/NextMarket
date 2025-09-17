import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVoucherUsageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  voucher_id!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  user_id!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  order_id!: number;
}
