import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
    private userService: UserService
  ) {}

  /**
   * Check if a user is an ancestor of another user in the affiliate tree
   * Used to prevent circular references
   */
  private async checkIfAncestor(
    potentialAncestorId: number,
    potentialDescendantId: number
  ): Promise<boolean> {
    try {
      const query = `
        WITH RECURSIVE AncestorsCTE AS (
          SELECT referrer_id, 1 AS level
          FROM referrals
          WHERE referee_id = $1 AND referrer_id IS NOT NULL
          
          UNION ALL
          
          SELECT r.referrer_id, a.level + 1
          FROM referrals r
          INNER JOIN AncestorsCTE a ON r.referee_id = a.referrer_id
          WHERE a.level < 50 AND r.referrer_id IS NOT NULL
        )
        SELECT referrer_id FROM AncestorsCTE
        WHERE referrer_id = $2
        LIMIT 1
      `;
      
      const result = await this.repository.query(query, [
        potentialDescendantId,
        potentialAncestorId
      ]);
      
      return result.length > 0;
    } catch (error) {
      console.error('Error checking ancestor relationship:', error);
      return false;
    }
  }

  /**
   * Check if a user already has a referrer
   * Used to prevent duplicate referrers (single tree rule)
   */
  private async checkDuplicateReferrer(userId: number): Promise<Referral | null> {
    return this.repository.findOne({
      where: { referee: { id: userId } },
      relations: ['referrer', 'referee']
    });
  }

  async createForUser(
    userId: number,
    createDto: CreateReferralDto
  ): Promise<Referral> {
    const referrer = await this.userService.findOne(userId);
    if (!referrer || !referrer.is_affiliate) {
      throw new ForbiddenException(
        'User is not an affiliate or does not exist'
      );
    }

    const referee = await this.userService.findOne(createDto.referee_id);
    if (!referee) {
      throw new NotFoundException(
        `Referee with id ${createDto.referee_id} not found`
      );
    }

    // VALIDATION 1: Prevent self-reference (A → A)
    if (userId === createDto.referee_id) {
      throw new BadRequestException(
        'Người dùng không thể là referrer của chính mình'
      );
    }

    // VALIDATION 2: Prevent duplicate referrer (single tree rule)
    const existingReferral = await this.checkDuplicateReferrer(createDto.referee_id);
    if (existingReferral) {
      throw new BadRequestException(
        `Người dùng ${createDto.referee_id} đã có referrer rồi. Không thể tạo referral mới.`
      );
    }

    // VALIDATION 3: Prevent circular reference (A → B → C → A)
    const isCircular = await this.checkIfAncestor(
      createDto.referee_id,
      userId
    );
    if (isCircular) {
      throw new BadRequestException(
        'Không thể tạo circular reference: referee là ancestor của referrer'
      );
    }

    const entity = this.repository.create({
      referrer: { id: userId } as any,
      referee: { id: createDto.referee_id } as any,
      code:
        createDto.code ||
        `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      status: 'pending',
      uuid: crypto.randomUUID(),
      created_at: new Date(),
    });

    return this.repository.save(entity);
  }

  async findUserReferrals(userId: number): Promise<Referral[]> {
    const user = await this.userService.findOne(userId);
    if (!user || !user.is_affiliate) {
      throw new ForbiddenException(
        'User is not an affiliate or does not exist'
      );
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
