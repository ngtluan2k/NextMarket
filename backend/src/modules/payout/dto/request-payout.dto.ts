import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPayoutDto {
  @ApiProperty({ description: 'Số tiền yêu cầu rút', minimum: 0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount!: number;
}