import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Loại tài liệu', example: 'business_license' })
  @IsNotEmpty()
  @IsString()
  doc_type!: string;

  @ApiProperty({ description: 'URL của file tài liệu' })
  @IsNotEmpty()
  @IsUrl()
  file_url!: string;
}