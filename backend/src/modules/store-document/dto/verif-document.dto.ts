import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyDocumentDto {
  @ApiPropertyOptional({ description: 'Trạng thái xác minh' })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Thời gian xác minh' })
  @IsOptional()
  @IsDateString()
  verified_at?: string;
}