import { IsBoolean, IsOptional, IsInt } from 'class-validator';

export class UpdateAffiliateRootDto {
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}