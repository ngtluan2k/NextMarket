import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreAddressDto {
  @ApiProperty({ description: 'Tên người nhận' })
  @IsNotEmpty()
  @IsString()
  recipient_name!: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'Địa chỉ đường phố' })
  @IsNotEmpty()
  @IsString()
  street!: string;

  @ApiProperty({ description: 'Thành phố' })
  @IsNotEmpty()
  @IsString()
  city!: string;

  @ApiProperty({ description: 'Tỉnh/Thành phố' })
  @IsNotEmpty()
  @IsString()
  province!: string;

  @ApiProperty({ description: 'Quốc gia' })
  @IsNotEmpty()
  @IsString()
  country!: string;

  @ApiProperty({ description: 'Mã bưu điện' })
  @IsNotEmpty()
  @IsString()
  postal_code!: string;

  @ApiProperty({ description: 'Loại địa chỉ', example: 'warehouse' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiPropertyOptional({ description: 'Chi tiết thêm' })
  @IsOptional()
  @IsString()
  detail?: string;

  @ApiPropertyOptional({ description: 'Là địa chỉ mặc định' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({ description: 'Là bản nháp' })
  @IsOptional()
  @IsBoolean()
  is_draft?: boolean;
}