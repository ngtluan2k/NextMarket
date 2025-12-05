import { IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateAffiliateRootDto {
  @IsInt()
  userId!: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}