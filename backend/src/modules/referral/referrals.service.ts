import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './referrals.entity';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import * as crypto from 'crypto';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private repository: Repository<Referral>
  ) {}

  async create(createDto: CreateReferralDto): Promise<Referral> {
    const entity = this.repository.create(createDto);
    entity.uuid = crypto.randomUUID();
    entity.created_at = new Date();
    return this.repository.save(entity);
  }

  async findAll(): Promise<Referral[]> {
    return this.repository.find({ relations: ['referrer', 'referee'] });
  }

  async findOne(id: number): Promise<Referral> {
    const res = await this.repository.findOne({
      where: { id },
      relations: ['referrer', 'referee'],
    });

    if (!res) {
      throw new NotFoundException(`cannot found referral with id ${id}`);
    }
    return res;
  }

  async update(id: number, updateDto: UpdateReferralDto): Promise<Referral> {
   const res = await this.repository.update(id, updateDto);
    if(!res){
      throw new NotFoundException(`Cannot update referrer with id ${id}`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
