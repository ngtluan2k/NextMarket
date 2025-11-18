import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGroupAffiliateLinkDto {
  @IsNumber()
  @IsNotEmpty()
  storeId: number;

  @IsNumber()
  @IsOptional()
  programId?: number;

  @IsString()
  @IsOptional()
  groupName?: string;

  @IsNumber()
  @IsOptional()
  targetMemberCount?: number;

  @IsString()
  @IsOptional()
  expiresAt?: string;
}
