import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './referrals.entity';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { UserService } from '../user/user.service';
import * as crypto from 'crypto';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private repository: Repository<Referral>,
    private userService: UserService,
  ) {}

  async createForUser(userId: number, createDto: CreateReferralDto): Promise<Referral> {
    const referrer = await this.userService.findOne(userId);
    if (!referrer || !referrer.is_affiliate) {
      throw new ForbiddenException('User is not an affiliate or does not exist');
    }

    const referee = await this.userService.findOne(createDto.referee_id);
    if (!referee) {
      throw new NotFoundException(`Referee with id ${createDto.referee_id} not found`);
    }

    const entity = this.repository.create({
      referrer: { id: userId } as any,
      referee: { id: createDto.referee_id } as any,
      code: createDto.code || `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      status: 'pending',
      uuid: crypto.randomUUID(),
      created_at: new Date(),
    });

    return this.repository.save(entity);
  }

  async findUserReferrals(userId: number): Promise<Referral[]> {
    const user = await this.userService.findOne(userId);
    if (!user || !user.is_affiliate) {
      throw new ForbiddenException('User is not an affiliate or does not exist');
    }

    return this.repository.find({
      where: { referrer: { id: userId } },
      relations: ['referrer', 'referee'],
    });
  }

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
      throw new NotFoundException(`Cannot find referral with id ${id}`);
    }
    return res;
  }

  async update(id: number, updateDto: UpdateReferralDto): Promise<Referral> {
    const res = await this.repository.update(id, updateDto);
    if (!res.affected) {
      throw new NotFoundException(`Cannot update referral with id ${id}`);
    }
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}