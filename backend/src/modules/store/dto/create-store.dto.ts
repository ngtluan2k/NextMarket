import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ description: 'Tên cửa hàng' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Slug của cửa hàng' })
  @IsNotEmpty()
  @IsString()
  slug!: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  @IsOptional()
  @IsString()
  logo_url?: string;
}
