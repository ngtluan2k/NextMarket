import { Injectable } from '@nestjs/common';
import { CreateAffiliateCommissionDto } from './dto/create-affiliate-commission.dto';
import { UpdateAffiliateCommissionDto } from './dto/update-affiliate-commission.dto';

@Injectable()
export class AffiliateCommissionsService {
  create(createAffiliateCommissionDto: CreateAffiliateCommissionDto) {
    return 'This action adds a new affiliateCommission';
  }

  findAll() {
    return `This action returns all affiliateCommissions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} affiliateCommission`;
  }

  update(
    id: number,
    updateAffiliateCommissionDto: UpdateAffiliateCommissionDto
  ) {
    return `This action updates a #${id} affiliateCommission`;
  }

  remove(id: number) {
    return `This action removes a #${id} affiliateCommission`;
  }
}
