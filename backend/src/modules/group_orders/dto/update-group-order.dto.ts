import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const GROUP_ORDER_STATUSES = ['open', 'locked', 'completed', 'cancelled'] as const;
type GroupOrderStatus = typeof GROUP_ORDER_STATUSES[number];

export class UpdateGroupOrderDto {

  @ApiPropertyOptional({ description: 'tên group'})
  @IsOptional()
  @IsString()
  @MaxLength(250)
  name?: string;

  @ApiPropertyOptional({ description: 'Trạng thái group', enum: GROUP_ORDER_STATUSES })
  @IsOptional()
  @IsIn(GROUP_ORDER_STATUSES)
  status?: GroupOrderStatus;

  @ApiPropertyOptional({ description: 'Thời điểm hết hạn (ISO8601)', example: '2025-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Link mời tham gia' })
  @IsOptional()
  @IsString()
  inviteLink?: string;
}