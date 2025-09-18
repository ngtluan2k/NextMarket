import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestUpgradeDto {
  @ApiProperty({
    description: 'Level muốn nâng cấp',
    enum: ['trusted', 'premium'],
  })
  @IsEnum(['trusted', 'premium'])
  requested_level!: 'trusted' | 'premium';

  @ApiPropertyOptional({ description: 'Ghi chú yêu cầu' })
  @IsOptional()
  @IsString()
  note?: string;
}
