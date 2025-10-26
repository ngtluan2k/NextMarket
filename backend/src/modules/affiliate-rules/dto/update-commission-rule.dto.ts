import { IsInt, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class UpdateCommissionRuleDto {
  @IsOptional()
  @IsInt()
  program_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  level?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate_percent?: number;

  @IsOptional()
  @IsDateString()
  active_from?: string | null;

  @IsOptional()
  @IsDateString()
  active_to?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cap_per_order?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cap_per_user?: number | null;
}