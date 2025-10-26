import { IsInt, IsNumber, IsOptional, IsDateString, Min, IsPositive, IsIn } from 'class-validator';

export class CreateCommissionRuleDto {
  @IsOptional()
  @IsInt()
  program_id?: number | null;

  @IsInt()
  @Min(0)
  level!: number;

  @IsNumber()
  @Min(0)
  rate_percent!: number;

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