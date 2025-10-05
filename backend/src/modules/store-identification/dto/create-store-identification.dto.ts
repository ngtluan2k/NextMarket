import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreIdentificationDto {
  @ApiProperty({ description: 'Loại định danh', example: 'owner_id' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiPropertyOptional({
    description:
      'ID cửa hàng (string). Nếu không truyền, server sẽ tự suy ra theo user.',
  })
  @IsOptional()
  store_id!: number;

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

  @ApiPropertyOptional({
    description: 'Đánh dấu lưu nháp',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_draft?: boolean;
}
