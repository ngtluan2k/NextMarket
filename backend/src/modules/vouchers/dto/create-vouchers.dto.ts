import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsDate,
  Min,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVoucherDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  discount_type!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @IsPositive()
  discount_value!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @IsPositive()
  min_order_amount?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_date!: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_date!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @IsPositive()
  usage_limit?: number;
}
