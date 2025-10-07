import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBankAccountDto {
  @ApiProperty({ description: 'Tên ngân hàng' })
  @IsNotEmpty()
  @IsString()
  bank_name!: string;

  @ApiProperty({ description: 'Số tài khoản' })
  @IsNotEmpty()
  @IsString()
  account_number!: string;

  @ApiProperty({ description: 'Tên chủ tài khoản' })
  @IsNotEmpty()
  @IsString()
  account_holder!: string;

  @ApiPropertyOptional({ description: 'Là tài khoản mặc định' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
