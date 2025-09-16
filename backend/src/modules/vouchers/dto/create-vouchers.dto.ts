import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDate } from 'class-validator';
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
  discount_value!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
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
  usage_limit?: number;
}
