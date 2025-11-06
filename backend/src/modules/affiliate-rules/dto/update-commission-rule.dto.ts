import { IsString, IsNumber, IsEnum, IsOptional, IsArray, Min, Max, ValidateIf } from 'class-validator';
import { CalculationMethod } from '../affiliate-rules.entity';

export class UpdateCommissionRuleDto {
  @IsOptional()
  @IsString()
  program_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  // === Calculation Config ===
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  total_budget?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  num_levels?: number;

  @IsOptional()
  @IsEnum(CalculationMethod)
  calculation_method?: CalculationMethod;

  // Method-specific fields
  @ValidateIf(o => o.calculation_method === CalculationMethod.GEOMETRIC_DECAY)
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(0.95)
  decay_rate?: number;

  @ValidateIf(o => o.calculation_method === CalculationMethod.FIBONACCI_RATIO)
  @IsOptional()
  @IsNumber()
  starting_index?: number;

  @ValidateIf(o => o.calculation_method === CalculationMethod.WEIGHTED_CUSTOM)
  @IsOptional()
  @IsArray()
  weights?: number[];

  // === Caps & Limits ===
  @IsOptional()
  @IsNumber()
  cap_order?: number;

  @IsOptional()
  @IsNumber()
  cap_user?: number;

  @IsOptional()
  @IsNumber()
  time_limit_days?: number;
}