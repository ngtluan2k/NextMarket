import { UserService } from '../user/user.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { CreateAffiliateLinkDto } from '../affiliate-links/dto/create-affiliate-link.dto';
import { UpdateAffiliateLinkDto } from '../affiliate-links/dto/update-affiliate-link.dto';
import * as crypto from 'crypto';
import { AffiliateCommission } from '../affiliate-commissions/affiliate-commission.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { In } from 'typeorm';

@Injectable()
export class AffiliateLinksService {
  constructor(
    @InjectRepository(AffiliateLink)
    private repository: Repository<AffiliateLink>,
    private userService: UserService,
    @InjectRepository(AffiliateCommission)
    private commissionRepository: Repository<AffiliateCommission>,
    @InjectRepository(AffiliateProgram)
    private programRepository: Repository<AffiliateProgram>
  ) {}

  async create(createDto: CreateAffiliateLinkDto): Promise<AffiliateLink> {
    const entity = this.repository.create(createDto);
    entity.uuid = crypto.randomUUID();
    entity.created_at = new Date();
    entity.program_id = { id: createDto.programId } as any;
    entity.user_id = { id: createDto.userId } as any;
    entity.code = createDto.code;

    const savedLink = await this.repository.save(entity);

    await this.userService.updateAffiliateStatus(createDto.userId, true);
    return savedLink;
  }

  async findAll(): Promise<AffiliateLink[]> {
    return this.repository.find({ relations: ['program_id', 'user_id'] });
  }

  async findOne(id: number): Promise<AffiliateLink> {
    const res = await this.repository.findOne({
      where: { id },
      relations: ['program_id', 'user_id'],
    });
    if (!res) {
      throw new NotFoundException(`cannot found affiliate links at id ${id}!`);
    }
    return res;
  }

  async update(
    id: number,
    updateDto: UpdateAffiliateLinkDto
  ): Promise<AffiliateLink> {
    await this.repository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async register(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    if (user.is_affiliate) {
      return {
        message: 'You are already registered as an affiliate',
        affiliate_code: user.code,
      };
    }

    if (!user.code) {
      user.code = `AFF${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      await this.userService.update(userId, { code: user.code });
    }
    
    const defaultProgram = await this.programRepository.findOne({
      where: { status: 'active' },
      order: { id: 'ASC' },
    });
    if (!defaultProgram) {
      throw new NotFoundException('No active affiliate programs available for registration');
    }

    const affiliateLink = this.repository.create({
      user_id: { id: userId } as any,
      program_id: { id: defaultProgram.id } as any,
      code: user.code,
      created_at: new Date(),
    });
    await this.repository.save(affiliateLink);

    await this.userService.updateAffiliateStatus(userId, true);
    return {
      message: 'Successfully registered as affiliate',
      affiliate_code: user.code,
    };
  }

  async unregister(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.is_affiliate) {
      return { message: 'You are not registered as an affiliate' };
    }

    const affiliateLinks = await this.repository.find({
      where: { user_id: { id: userId } },
    });
    if (affiliateLinks.length > 0) {
      await this.commissionRepository.update(
        {
          link_id: { id: In(affiliateLinks.map((link) => link.id)) },
          status: 'pending',
        },
        { status: 'canceled' }
      );
      await this.repository.delete({ user_id: { id: userId } });
    }
    await this.userService.updateAffiliateStatus(userId, false);

    return { message: 'Successfully unregistered from affiliate program' };
  }

  async getStatus(userId: number) {
    try {
      const user = await this.userService.findOne(userId);
      if (!user) return { error: 'User not found' };

      const affiliateLinks = await this.repository.find({
        where: { user_id: { id: userId } },
        relations: ['program_id'],
      });

      const linkIds = affiliateLinks.map(l => l.id);
      let commissionsTotal = 0;

      if (linkIds.length > 0) {
        const commissions = await this.commissionRepository
          .createQueryBuilder('commission')
          .select('SUM(commission.amount)', 'total')
          .where(
            'commission.link_id IN (:...linkIds) AND commission.status = :status',
            { linkIds, status: 'paid' }
          )
          .getRawOne();
        commissionsTotal = commissions?.total || 0;
      }

      return {
        is_affiliate: user.is_affiliate,
        affiliate_code: user.code,
        program_name: affiliateLinks.length > 0 ? affiliateLinks[0].program_id?.name : null,
        commissions_earned: commissionsTotal,
      };
    } catch (error) {
      console.error('Error in getStatus:', error);
      return { error: 'Internal server error' };
    }
  }

  async createAffiliateLink(
    userId: number,
    productId: number,
    variantSlug?: string
  ) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.is_affiliate) {
      throw new NotFoundException('User is not an affiliate or does not exist');
    }

    const defaultProgram = await this.programRepository.findOne({
      where: { status: 'active' },
      order: { id: 'ASC' },
    });
    if (!defaultProgram) {
      throw new NotFoundException('No active affiliate programs available');
    }

    const baseLink = `https://everymart.com/product/${productId}?aff=${user.code}`;
    const affiliateLink = this.repository.create({
      user_id: { id: userId } as any,
      program_id: { id: defaultProgram.id } as any,
      code: variantSlug
        ? `${user.code}-${productId}-${variantSlug}`
        : `${user.code}-${productId}`,
      created_at: new Date(),
    });

    const savedLink = await this.repository.save(affiliateLink);
    return {
      message: 'Affiliate link created',
      affiliate_link: `${baseLink}${
        variantSlug ? `&variant=${variantSlug}` : ''
      }`,
      link_id: savedLink.id,
    };
  }

  async getMyLinks(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.is_affiliate) {
      return {
        message: 'User is not an affiliate or does not exist',
        links: [],
      };
    }

    const links = await this.repository.find({
      where: { user_id: { id: userId } },
      relations: ['program_id'],
    });
    if (!links.length) {
      return {
        message:
          'No affiliate links created. Please create a link for a specific product first.',
        links: [],
      };
    }

    const affiliateLinks = links.map((link) => {
     
      if (!link.code) {
        return {
          link_id: link.id,
          affiliate_link: `https://everymart.com/product/unknown?aff=${user.code}`,
          program_name: link.program_id?.name,
          created_at: link.created_at,
        };
      }

      const codeParts = link.code.split('-');
      const productId = codeParts[1] || 'unknown'; 
      const variantSlug = codeParts[2];
      const baseLink = `https://everymart.com/product/${productId}?aff=${user.code}`;
      
      return {
        link_id: link.id,
        affiliate_link: `${baseLink}${
          variantSlug ? `&variant=${variantSlug}` : ''
        }`,
        program_name: link.program_id?.name,
        created_at: link.created_at,
      };
    });

    return { message: 'Affiliate links retrieved', links: affiliateLinks };
  }
}