import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliatePlatform } from './affiliate-platform.entity';
import { CreateAffiliatePlatformDto } from './dto/create-affiliate-platform.dto';
import { UpdateAffiliatePlatformDto } from './dto/update-affiliate-platform.dto';

@Injectable()
export class AffiliatePlatformService {
  constructor(
    @InjectRepository(AffiliatePlatform)
    private readonly platformRepo: Repository<AffiliatePlatform>
  ) {}

  findAll(): Promise<AffiliatePlatform[]> {
    return this.platformRepo.find();
  }

  findById(id: number): Promise<AffiliatePlatform | null> {
    return this.platformRepo.findOneBy({ id });
  }

  async create(dto: CreateAffiliatePlatformDto): Promise<AffiliatePlatform> {
    const newPlatform = this.platformRepo.create(dto);
    return this.platformRepo.save(newPlatform);
  }

  async update(
    id: number,
    dto: UpdateAffiliatePlatformDto
  ): Promise<AffiliatePlatform> {
    await this.platformRepo.update(id, dto);
    const updated = await this.platformRepo.findOneBy({ id });
    if (!updated) {
      throw new Error(`AffiliatePlatform with id ${id} not found.`);
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.platformRepo.delete(id);
  }
}
