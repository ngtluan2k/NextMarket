import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VoucherUsage } from '../voucher-usage/voucher_usage.entity';
import { CreateVoucherUsageDto } from './dto/create-voucher-usage.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VoucherUsageService {
  constructor(
    @InjectRepository(VoucherUsage)
    private usageRepo: Repository<VoucherUsage>,
  ) {}

  async create(dto: CreateVoucherUsageDto): Promise<VoucherUsage> {
    const usage = this.usageRepo.create({
      ...dto,
      uuid: uuidv4(),
      used_at: new Date(),
    });
    return this.usageRepo.save(usage);
  }

  async findAll(): Promise<VoucherUsage[]> {
    return this.usageRepo.find({ relations: ['voucher', 'user', 'order'] });
  }
}
