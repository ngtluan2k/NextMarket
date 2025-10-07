import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateProgram } from './affiliate-program.entity';
import { CreateAffiliateProgramDto } from './dto/create-affiliate-program.dto';
import { UpdateAffiliateProgramDto } from './dto/update-affiliate-program.dto';
import * as crypto from 'crypto';

@Injectable()
export class AffiliateProgramsService {
  constructor(
    @InjectRepository(AffiliateProgram)
    private repository: Repository<AffiliateProgram>,
  ) {}

  async create(createDto: CreateAffiliateProgramDto): Promise<AffiliateProgram> {
    const entity = this.repository.create(createDto);
    entity.uuid = crypto.randomUUID();
    entity.createdAt = new Date();
    return this.repository.save(entity);
  }

  async findAll(): Promise<AffiliateProgram[]> {
    return this.repository.find();
  }

 async findOne(id: number): Promise<AffiliateProgram> {
  const program = await this.repository.findOneBy({ id });
  if (!program) {
    throw new NotFoundException(`Affiliate Program with id ${id} not found`);
  }
  return program;
}

  async update(id: number, updateDto: UpdateAffiliateProgramDto): Promise<AffiliateProgram> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}