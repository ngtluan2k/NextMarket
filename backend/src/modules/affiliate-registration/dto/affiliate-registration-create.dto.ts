import { IsString, IsEnum, IsOptional, IsInt, IsUUID } from 'class-validator';

export class CreateAffiliateRegistrationDto {
  @IsInt()
  user_id!: number;

  @IsUUID()
  uuid!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  phone?: string;

  @IsString()
  email?: string;

  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'])
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';
}
