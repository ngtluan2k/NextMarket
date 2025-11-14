// src/affiliate-rule/dto/create-rule.dto.ts

import { IsString, IsNumber, IsEnum, IsOptional, IsArray, Min, Max, ValidateIf } from 'class-validator';
import { CalculationMethod } from '../affiliate-rules.entity';
export class CreateRuleDto {
  @IsString()
  program_id!: string;

  @IsString()
  name!: string;

  // === Calculation Config ===
  @IsNumber()
  @Min(0.01)
  @Max(100)
  total_budget!: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  num_levels!: number;

  @IsEnum(CalculationMethod)
  calculation_method!: CalculationMethod;

  // Method-specific fields
  @ValidateIf(o => o.calculation_method === CalculationMethod.GEOMETRIC_DECAY)
  @IsNumber()
  @Min(0.1)
  @Max(0.95)
  decay_rate?: number;

  @ValidateIf(o => o.calculation_method === CalculationMethod.FIBONACCI_RATIO)
  @IsOptional()
  @IsNumber()
  starting_index?: number;

  @ValidateIf(o => o.calculation_method === CalculationMethod.WEIGHTED_CUSTOM)
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