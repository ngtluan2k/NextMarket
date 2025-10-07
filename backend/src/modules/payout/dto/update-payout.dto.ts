import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePayoutDto {
  @ApiPropertyOptional({
    description: 'Trạng thái payout',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  status?: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional({ description: 'Thời gian xử lý' })
  @IsOptional()
  @IsDateString()
  processed_at?: string;
}
