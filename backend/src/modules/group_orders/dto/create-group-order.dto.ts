import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, IsNumber, Min } from 'class-validator';

export class CreateGroupOrderDto {
  @ApiProperty({ description: 'tên nhóm' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(250)
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_percent?: number;

  @ApiProperty({ description: 'ID cửa hàng tạo group order' })
  @IsNotEmpty()
  @IsInt()
  storeId!: number;

  @ApiProperty({ description: 'ID user chủ phòng (host)' })
  @IsNotEmpty()
  @IsInt()
  hostUserId!: number;

  @ApiPropertyOptional({
    description: 'Thời điểm hết hạn group (ISO8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Mã mời tham gia (nếu có)' })
  @IsOptional()
  join_code?: string;

  @ApiPropertyOptional({ description: 'Link mời tham gia (nếu có)' })
  @IsOptional()
  inviteLink?: string;

  @ApiPropertyOptional({
    description: 'Số lượng thành viên mục tiêu để tự động khóa nhóm',
    default: 2,
    minimum: 2,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(100)
  targetMemberCount?: number;

  @ApiPropertyOptional({
    description: 'Mã affiliate để tracking commission (ví dụ: AFF123)',
  })
  @IsOptional()
  @IsString()
  affiliateCode?: string;
}
