import { IsString, IsInt, IsEnum, Min, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAffiliateProgramDto {
  @ApiProperty()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  cookie_days?: number;

  @ApiProperty({ enum: ['percentage', 'fixed'] })
  @IsEnum(['percentage', 'fixed'])
  commission_type?: 'percentage' | 'fixed';

  @ApiProperty()
  @IsInt()
  commission_value?: number;

  @ApiProperty({ enum: ['active', 'inactive', 'paused'] })
  @IsEnum(['active', 'inactive', 'paused'])
  status?: 'active' | 'inactive' | 'paused';

  // Budget fields
  @ApiPropertyOptional({ description: 'Total budget amount in VND' })
  @IsOptional()
  @IsNumber()
  total_budget_amount?: number;

  @ApiPropertyOptional({ description: 'Monthly budget cap in VND' })
  @IsOptional()
  @IsNumber()
  monthly_budget_cap?: number;

  @ApiPropertyOptional({ description: 'Daily budget cap in VND' })
  @IsOptional()
  @IsNumber()
  daily_budget_cap?: number;

  @ApiPropertyOptional({ description: 'Auto pause when budget limit reached' })
  @IsOptional()
  @IsBoolean()
  auto_pause_on_budget_limit?: boolean;
}
