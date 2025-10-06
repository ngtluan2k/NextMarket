import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateCommission } from './affiliate-commission.entity';
import { CreateAffiliateCommissionDto } from './dto/create-affiliate-commission.dto';
import { UpdateAffiliateCommissionDto } from './dto/update-affiliate-commission.dto';
import * as crypto from 'crypto';

@Injectable()
export class AffiliateCommissionsService {
  constructor(
    @InjectRepository(AffiliateCommission)
    private repository: Repository<AffiliateCommission>
  ) {}

  async create(
  createDto: CreateAffiliateCommissionDto,
): Promise<AffiliateCommission> {
  const entity = new AffiliateCommission();
  entity.uuid = crypto.randomUUID();
  entity.amount = createDto.amount;
  entity.status = createDto.status;
  entity.created_at = new Date();

  // map ids -> relation objects
  entity.link_id = { id: createDto.linkId } as any;
  entity.order_id = { id: createDto.orderId } as any;

  if (createDto.paid_at) {
    entity.paid_at = createDto.paid_at;
  }

  return this.repository.save(entity);
}

  async findAll(): Promise<AffiliateCommission[]> {
    return this.repository.find({ relations: ['link_id', 'order_id'] });
  }

  async findOne(id: number): Promise<AffiliateCommission> {
    const commission = await this.repository.findOne({
      where: { id },
      relations: ['link_id', 'order_id'],
    });
    if (!commission)
      throw new NotFoundException(
        `affiliate commitions with id ${id} is not found`
      );
    return commission;
  }

  async update(
    id: number,
    updateDto: UpdateAffiliateCommissionDto
  ): Promise<AffiliateCommission> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
