import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateRootTracking } from '../dto/affiliate-root-tracking.entity';
import { CreateAffiliateRootDto } from '../dto/create-affiliate-root.dto';
import { UpdateAffiliateRootDto } from '../dto/update-affiliate-root.dto';

@Injectable()
export class AffiliateRootTrackingService {
  constructor(
    @InjectRepository(AffiliateRootTracking)
    private readonly affiliateRootRepo: Repository<AffiliateRootTracking>,
  ) {}

  async create(dto: CreateAffiliateRootDto): Promise<AffiliateRootTracking> {
    // Nếu tạo root active mới, deactivate root cũ
    if (dto.isActive !== false) {
      await this.deactivateCurrentRoot();
    }

    const record = this.affiliateRootRepo.create(dto);
    return this.affiliateRootRepo.save(record);
  }

  async findAll(): Promise<AffiliateRootTracking[]> {
    return this.affiliateRootRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<AffiliateRootTracking> {
    const record = await this.affiliateRootRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!record) {
      throw new NotFoundException(`Affiliate root with ID ${id} not found`);
    }

    return record;
  }

  async findByUuid(uuid: string): Promise<AffiliateRootTracking> {
    const record = await this.affiliateRootRepo.findOne({
      where: { uuid },
      relations: ['user'],
    });

    if (!record) {
      throw new NotFoundException(`Affiliate root with UUID ${uuid} not found`);
    }

    return record;
  }

  async findActiveRoot(): Promise<AffiliateRootTracking> {
    const record = await this.affiliateRootRepo.findOne({
      where: { isActive: true },
      relations: ['user'],
    });

    if (!record) {
      throw new NotFoundException('No active affiliate root found');
    }

    return record;
  }

  async update(id: number, dto: UpdateAffiliateRootDto): Promise<AffiliateRootTracking> {
    const record = await this.findOne(id);

    // Nếu set active = true, deactivate root hiện tại
    if (dto.isActive === true && !record.isActive) {
      await this.deactivateCurrentRoot();
    }

    Object.assign(record, dto);
    return this.affiliateRootRepo.save(record);
  }

  async remove(id: number): Promise<void> {
    const record = await this.findOne(id);
    await this.affiliateRootRepo.remove(record);
  }

  async setActiveRoot(id: number): Promise<AffiliateRootTracking> {
    await this.deactivateCurrentRoot();
    return this.update(id, { isActive: true });
  }

  private async deactivateCurrentRoot(): Promise<void> {
    await this.affiliateRootRepo.update(
      { isActive: true },
      { isActive: false },
    );
  }
}