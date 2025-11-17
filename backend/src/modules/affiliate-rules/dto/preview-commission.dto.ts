import { IsNumber, IsInt, IsOptional, Min } from 'class-validator';

export class PreviewCommissionDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsInt()
  @Min(0)
  maxLevels!: number;

  @IsOptional()
  @IsInt()
  programId?: number | null;
}
