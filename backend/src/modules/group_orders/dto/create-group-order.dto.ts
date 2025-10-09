import { join } from 'path';
// backend/src/modules/group_orders/dto/create-group-order.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateGroupOrderDto {
  @ApiProperty({ description: 'tên nhóm' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(250)
  name!: string;

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
}
