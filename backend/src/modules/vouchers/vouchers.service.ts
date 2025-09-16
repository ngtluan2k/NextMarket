import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from '../vouchers/vouchers.entity';
import { CreateVoucherDto } from './dto/create-vouchers.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private vouchersRepo: Repository<Voucher>,
  ) {}

  async create(dto: CreateVoucherDto): Promise<Voucher> {
    const voucher = this.vouchersRepo.create({
      ...dto,
      uuid: uuidv4(),
      used_count: 0,
    });
    return this.vouchersRepo.save(voucher);
  }

  async findAll(): Promise<Voucher[]> {
    return this.vouchersRepo.find();
  }

  async findOne(id: number): Promise<Voucher | null> {
    return this.vouchersRepo.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.vouchersRepo.delete(id);
  }
}
