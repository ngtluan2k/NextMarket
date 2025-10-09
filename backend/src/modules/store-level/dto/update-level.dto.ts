import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StoreLevelEnum } from '../../store-level/store-level.enum';

export class UpdateLevelDto {
  @ApiPropertyOptional({
    description: 'Cấp độ store',
    enum: StoreLevelEnum,
    example: StoreLevelEnum.BASIC,
  })
  @IsOptional()
  @IsEnum(StoreLevelEnum)
  level?: StoreLevelEnum;

  @ApiPropertyOptional({ description: 'Thời gian nâng cấp' })
  @IsOptional()
  @IsDateString()
  upgraded_at?: string;
}
