import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DocumentType {
  BUSINESS_LICENSE = 'BUSINESS_LICENSE', // Giấy phép kinh doanh
  TAX_CERTIFICATE = 'TAX_CERTIFICATE', // Giấy chứng nhận thuế
  OTHER = 'OTHER', // Khác
}

export class CreateStoreDocumentDto {
  @ApiProperty({
    description: 'ID of store information',
    example: 1,
  })
  @IsNumber()
  store_information_id!: number;

  @ApiProperty({
    description: 'Type of document',
    enum: DocumentType,
    example: DocumentType.BUSINESS_LICENSE,
  })
  @IsEnum(DocumentType)
  doc_type!: DocumentType;

  @ApiProperty({
    description: 'File URL after upload',
    example: '/uploads/documents/business-license-123.pdf',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_url!: string;
}
