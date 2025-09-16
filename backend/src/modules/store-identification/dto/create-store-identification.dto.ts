import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreIdentificationDto {
  @ApiProperty({ description: 'Loại định danh', example: 'owner_id' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Họ tên đầy đủ' })
  @IsNotEmpty()
  @IsString()
  full_name!: string;

  @ApiPropertyOptional({ description: 'Ảnh mặt trước' })
  @IsOptional()
  @IsString()
  img_front?: string;

  @ApiPropertyOptional({ description: 'Ảnh mặt sau' })
  @IsOptional()
  @IsString()
  img_back?: string;
}