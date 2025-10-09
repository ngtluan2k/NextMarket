import { IsNumber, IsString, IsEnum } from 'class-validator';

export class CreateReferralDto {
  @IsNumber()
  referrer_id!: number;

  @IsNumber()
  referee_id!: number;

  @IsString()
  code?: string;

  @IsEnum(['pending', 'accepted', 'rejected'])
  status?: string;
}
