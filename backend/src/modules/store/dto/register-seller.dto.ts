import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  ValidateNested,
  IsArray,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateStoreInformationDto } from '../../store-information/dto/create-store-information.dto';
import { CreateStoreIdentificationDto } from '../../store-identification/dto/create-store-identification.dto';
import { CreateBankAccountDto } from '../../store-bank-account/dto/create-bank-account.dto';
import { CreateStoreAddressDto } from '../../store-address/dto/create-store-address.dto';

// Store Email DTO
export class StoreEmailDto {
  @ApiProperty({ description: 'Email' })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: 'Lưu nháp email' })
  @IsOptional()
  @IsBoolean()
  is_draft?: boolean;
}

// Store Document DTO
export class StoreDocumentDto {
  @ApiProperty({ description: 'Loại tài liệu' })
  @IsNotEmpty()
  @IsString()
  doc_type!: string;

  @ApiProperty({ description: 'URL file tài liệu' })
  @IsNotEmpty()
  @IsString()
  file_url!: string;

  @ApiPropertyOptional({ description: 'Lưu nháp tài liệu' })
  @IsOptional()
  @IsBoolean()
  is_draft?: boolean;
}

export class RegisterSellerDto {
  // === BASIC STORE INFO (Required for simple registration) ===
  @ApiPropertyOptional({ description: 'Tên cửa hàng' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Slug của cửa hàng (tự động tạo nếu không cung cấp)',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  store_id?: number;

  @ApiPropertyOptional({ description: 'Mô tả cửa hàng' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Email cửa hàng' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại cửa hàng' })
  @IsOptional()
  @IsString()
  phone?: string;

  // === COMPREHENSIVE INFORMATION (Optional - using existing DTOs) ===
  @ApiPropertyOptional({
    description: 'Thông tin kinh doanh',
    type: CreateStoreInformationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateStoreInformationDto)
  store_information?: CreateStoreInformationDto;

  @ApiPropertyOptional({
    description: 'Thông tin định danh',
    type: CreateStoreIdentificationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateStoreIdentificationDto)
  store_identification?: CreateStoreIdentificationDto;

  @ApiPropertyOptional({
    description: 'Thông tin tài khoản ngân hàng',
    type: CreateBankAccountDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBankAccountDto)
  bank_account?: CreateBankAccountDto;

  @ApiPropertyOptional({
    description: 'Địa chỉ cửa hàng',
    type: CreateStoreAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateStoreAddressDto)
  store_address?: CreateStoreAddressDto;

  @ApiPropertyOptional({
    description: 'Email thông tin bổ sung',
    type: StoreEmailDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StoreEmailDto)
  store_information_email?: StoreEmailDto;

  @ApiPropertyOptional({
    description: 'Tài liệu đính kèm',
    type: [StoreDocumentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreDocumentDto)
  documents?: StoreDocumentDto[];

  @ApiPropertyOptional({ description: 'Có phải lưu nháp hay không' })
  @IsOptional()
  @IsBoolean()
  is_draft?: boolean;
}
