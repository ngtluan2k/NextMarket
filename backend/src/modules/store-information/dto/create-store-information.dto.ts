import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreInformationDto {
  @ApiProperty({ description: 'Loại thông tin', example: 'business' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Tên' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  addresses?: string;

  @ApiPropertyOptional({ description: 'Mã số thuế' })
  @IsOptional()
  @IsString()
  tax_code?: string;

  @ApiPropertyOptional({ description: 'ID tài liệu store' })
  @IsOptional()
  @IsInt()
  store_documents_id?: number;

  @ApiPropertyOptional({ description: 'ID email thông tin' })
  @IsOptional()
  @IsInt()
  store_information_email_id?: number;
}