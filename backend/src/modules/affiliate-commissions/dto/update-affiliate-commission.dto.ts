import { PartialType } from '@nestjs/swagger';
import { CreateAffiliateCommissionDto } from './create-affiliate-commission.dto';

export class UpdateAffiliateCommissionDto extends PartialType(
  CreateAffiliateCommissionDto
) {}
