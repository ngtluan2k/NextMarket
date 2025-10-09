import { IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateAffiliateCommissionDto {
  @IsNumber()
  linkId!: number;

  @IsNumber()
  orderItemId!: number;

  @IsNumber()
  amount!: number;

  @IsEnum(['pending', 'paid', 'cancelled'])
  status!: string;

  @IsOptional()
  paid_at?: Date;
}
