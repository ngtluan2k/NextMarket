import { IsString, IsNumber, IsEnum } from 'class-validator';

export class CreateAffiliateProgramDto {
  @IsString()
  name?: string;

  @IsNumber()
  cookie_days?: number;

  @IsEnum(['percentage', 'fixed'])
  commission_type?: string;

  @IsNumber()
  commission_value?: number;

  @IsEnum(['active', 'inactive'])
  status?: string;
}