import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AffiliateRegistration } from './affiliate-registration.entity';
import { AffiliatePlatform } from '../affiliate-platform/affiliate-platform.entity';
import { User } from '../user/user.entity'; // ⚠️ import entity User

@Injectable()
export class AffiliateRegistrationService {
  constructor(
    @InjectRepository(AffiliateRegistration)
    private readonly registrationRepo: Repository<AffiliateRegistration>,

    @InjectRepository(AffiliatePlatform)
    private readonly platformRepo: Repository<AffiliatePlatform>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(): Promise<AffiliateRegistration[]> {
    return this.registrationRepo.find({ relations: ['platforms'] });
  }

  async findById(id: number): Promise<AffiliateRegistration | null> {
    return this.registrationRepo.findOne({
      where: { id },
      relations: ['platforms'],
    });
  }

  async create(body: any): Promise<AffiliateRegistration> {
    const { userId, uuid, description, status, platformIds, phone, email } = body;

    const platforms = platformIds?.length
      ? await this.platformRepo.find({ where: { id: In(platformIds) } })
      : [];

    const registration = this.registrationRepo.create({
      userId,
      uuid,
      description,
      status: status ?? 'PENDING',
      platforms,
      phone,
      email,
    });

    return await this.registrationRepo.save(registration);
  }

  async update(id: number, body: Partial<AffiliateRegistration>) {
    await this.registrationRepo.update(id, body);
    return this.findById(id);
  }

  async remove(id: number) {
    await this.registrationRepo.delete(id);
  }


  async approveRegistration(id: number) {
    const registration = await this.registrationRepo.findOne({ where: { id } });
    if (!registration) throw new NotFoundException('Affiliate registration not found');

    registration.status = 'APPROVED';
    await this.registrationRepo.save(registration);

    if (registration.userId) {
      await this.userRepo.update(registration.userId, { is_affiliate: true });
    }

    return registration;
  }


  async rejectRegistration(id: number) {
    const registration = await this.registrationRepo.findOne({ where: { id } });
    if (!registration) throw new NotFoundException('Affiliate registration not found');

    registration.status = 'REJECTED';
    await this.registrationRepo.save(registration);

    if (registration.userId) {
      await this.userRepo.update(registration.userId, { is_affiliate: false });
    }

    return registration;
  }
}
