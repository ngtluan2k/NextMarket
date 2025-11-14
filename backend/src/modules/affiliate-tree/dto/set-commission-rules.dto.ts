import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UserCommissionRuleDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  level: number;

  @IsNumber()
  ratePercent: number;

  @IsOptional()
  @IsNumber()
  capPerOrder?: number;

  @IsOptional()
  @IsNumber()
  capPerUser?: number;

  @IsOptional()
  @IsString()
  activeFrom?: string;

  @IsOptional()
  @IsString()
  activeTo?: string;
}

export class SetCommissionRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserCommissionRuleDto)
  rules: UserCommissionRuleDto[];

  @IsOptional()
  @IsNumber()
  programId?: number;
}
