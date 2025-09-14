import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RateStoreDto {
  @ApiProperty({ description: 'Rating stars (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @ApiPropertyOptional({ description: 'Rating comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}