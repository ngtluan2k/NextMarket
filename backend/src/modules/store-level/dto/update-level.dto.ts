import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLevelDto {
  @ApiPropertyOptional({ 
    description: 'Cấp độ store', 
    enum: ['basic', 'trusted', 'premium'] 
  })
  @IsOptional()
  @IsEnum(['basic', 'trusted', 'premium'])
  level?: 'basic' | 'trusted' | 'premium';

  @ApiPropertyOptional({ description: 'Thời gian nâng cấp' })
  @IsOptional()
  @IsDateString()
  upgraded_at?: string;
}