import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateRegistrationPlatform } from './affiliate-registration-platform.entity';

@Injectable()
export class AffiliateRegistrationPlatformService {
  constructor(
    @InjectRepository(AffiliateRegistrationPlatform)
    private repo: Repository<AffiliateRegistrationPlatform>
  ) {}

  async findAll() {
    return this.repo.find({
      relations: ['registration', 'platform'],
    });
  }

  async create(data: Partial<AffiliateRegistrationPlatform>) {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  async remove(registrationId: number, platformId: number) {
    return this.repo.delete({ registrationId, platformId });
  }
}
