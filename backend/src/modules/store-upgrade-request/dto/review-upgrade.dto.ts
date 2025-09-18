import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsInt,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewUpgradeDto {
  @ApiPropertyOptional({
    description: 'Trạng thái duyệt',
    enum: ['pending', 'approved', 'rejected'],
  })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected'])
  status?: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional({ description: 'Ghi chú review' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Thời gian review' })
  @IsOptional()
  @IsDateString()
  reviewed_at?: string;

  @ApiPropertyOptional({ description: 'ID người review' })
  @IsOptional()
  @IsInt()
  reviewed_by?: number;
}
