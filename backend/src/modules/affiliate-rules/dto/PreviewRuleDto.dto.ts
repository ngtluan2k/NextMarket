// src/affiliate-rule/dto/preview-rule.dto.ts

import { IsEnum, IsNumber, IsOptional, IsArray, Min, Max, ValidateIf } from 'class-validator';

export enum CalculationMethod {
  GEOMETRIC_DECAY = 'GEOMETRIC_DECAY',
  FIBONACCI_RATIO = 'FIBONACCI_RATIO',
  WEIGHTED_CUSTOM = 'WEIGHTED_CUSTOM'
}

export class PreviewRuleDto {
  @IsNumber()
  @Min(0.01)
  @Max(100)
  total_budget!: number; // Tổng % dành cho affiliate (e.g., 36)

  @IsNumber()
  @Min(1)
  @Max(10)
  num_levels!: number; // Số cấp (e.g., 5)

  @IsEnum(CalculationMethod)
  method!: CalculationMethod;

  // For GEOMETRIC_DECAY
  @ValidateIf(o => o.method === CalculationMethod.GEOMETRIC_DECAY)
  @IsNumber()
  @Min(0.1)
  @Max(0.95)
  decay_rate?: number; // Hệ số giảm (e.g., 0.6)

  // For FIBONACCI_RATIO
  @ValidateIf(o => o.method === CalculationMethod.FIBONACCI_RATIO)
  @IsOptional()
  @IsNumber()
  starting_index?: number; // Optional, default auto

  // For WEIGHTED_CUSTOM
  @ValidateIf(o => o.method === CalculationMethod.WEIGHTED_CUSTOM)
  @IsArray()
  weights?: number[]; // [50, 25, 15, 7, 3]

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  round_to?: number; // Decimal places (default: 2)
}

// Response DTO
export class LevelRate {
  level!: number;
  rate!: number; // %
  weight?: number; // For weighted method
}

export class PreviewRuleResponseDto {
  levels!: LevelRate[];
  total!: number; // Should equal total_budget
  method!: CalculationMethod;
  warnings?: string[];
  suggestions?: string[];
}