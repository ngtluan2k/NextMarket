import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateFlashSaleScheduleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  starts_at!: string; // ISO date string, vd: '2025-11-01T09:00:00Z'

  @IsDateString()
  @IsNotEmpty()
  ends_at!: string; // ISO date string, vd: '2025-11-01T12:00:00Z'

}
