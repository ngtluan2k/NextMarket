import { Injectable } from '@nestjs/common';
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
    private repository: Repository<Referral>,
  ) {}

  async create(createDto: CreateReferralDto): Promise<Referral> {
    const entity = this.repository.create(createDto);
    entity.uuid = crypto.randomUUID();
    entity.created_at = new Date();
    return this.repository.save(entity);
  }

  async findAll(): Promise<Referral[]> {
    return this.repository.find({ relations: ['referrer_id', 'referee_id'] });
  }

  async findOne(id: number): Promise<Referral> {
    return this.repository.findOne({
      where: { id },
      relations: ['referrer_id', 'referee_id'],
    });
  }

  async update(id: number, updateDto: UpdateReferralDto): Promise<Referral> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}