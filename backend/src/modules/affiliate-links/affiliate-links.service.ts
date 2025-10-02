import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateLink } from './affiliate-links.entity';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';
import { UpdateAffiliateLinkDto } from './dto/update-affiliate-link.dto';
import * as crypto from 'crypto';

@Injectable()
export class AffiliateLinksService {
  constructor(
    @InjectRepository(AffiliateLink)
    private repository: Repository<AffiliateLink>,
  ) {}

  async create(createDto: CreateAffiliateLinkDto): Promise<AffiliateLink> {
    const entity = this.repository.create(createDto);
    entity.uuid = crypto.randomUUID();
    entity.created_at = new Date();
    entity.program_id = { id: createDto.programId } as any;
    entity.code = { id: createDto.userId } as any;
    return this.repository.save(entity);
  }

  async findAll(): Promise<AffiliateLink[]> {
    return this.repository.find({ relations: ['program_id', 'user_id'] });
  }

  async findOne(id: number): Promise<AffiliateLink> {
    const res = await this.repository.findOne({
      where: { id },
      relations: ['program_id', 'user_id'],
    });
    if(!res){
      throw new NotFoundException(`cannot found affiliate links at id ${id}!`)
    }
    return res;
  }

  async update(id: number, updateDto: UpdateAffiliateLinkDto): Promise<AffiliateLink> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}