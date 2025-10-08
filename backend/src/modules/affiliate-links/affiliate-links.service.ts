import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { CreateAffiliateLinkDto } from '../affiliate-links/dto/create-affiliate-link.dto';
import { UpdateAffiliateLinkDto } from '../affiliate-links/dto/update-affiliate-link.dto';
import { AffiliateCommission } from '../affiliate-commissions/affiliate-commission.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { UserService } from '../user/user.service';
import { Product } from '../product/product.entity';
import { OrderItem } from '../order-items/order-item.entity';
import * as crypto from 'crypto';

@Injectable()
export class AffiliateLinksService {
  constructor(
    @InjectRepository(AffiliateLink)
    private repository: Repository<AffiliateLink>,
    @InjectRepository(AffiliateCommission)
    private commissionRepository: Repository<AffiliateCommission>,
    @InjectRepository(AffiliateProgram)
    private programRepository: Repository<AffiliateProgram>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private userService: UserService
  ) {}

  async create(createDto: CreateAffiliateLinkDto): Promise<AffiliateLink> {
    const user = await this.userService.findOne(createDto.userId);
    if (!user || !user.is_affiliate) {
      throw new NotFoundException('User is not an affiliate or does not exist');
    }
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
      throw new NotFoundException(`Cannot find affiliate link with id ${id}`);
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
      throw new NotFoundException('No active affiliate programs available');
    }

    return {
      message: 'Successfully registered as an affiliate',
      affiliate_code: user.code,
    };
  }

  async unregister(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.is_affiliate) {
      throw new NotFoundException('User is not an affiliate or does not exist');
    }

    const affiliateLinks = await this.repository.find({
      where: { user_id: { id: userId } },
    });

    await this.commissionRepository.update(
      {
        link_id: { id: In(affiliateLinks.map((link) => link.id)) },
        status: 'pending',
      },
      { status: 'canceled' }
    );
    await this.repository.delete({ user_id: { id: userId } });
    await this.userService.updateAffiliateStatus(userId, false);

    return { message: 'Successfully unregistered from affiliate program' };
  }

  async createAffiliateLink(
    userId: number,
    productId: number,
    variantId?: number
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

    const baseLink = `http://localhost:4200/product/${productId}?aff=${user.code}`;

    const affiliateLink = this.repository.create({
      user_id: { id: userId } as any,
      program_id: { id: defaultProgram.id } as any,
      code: variantId
        ? `${user.code}:${productId}:${variantId}`
        : `${user.code}:${productId}`,
      created_at: new Date(),
      uuid: crypto.randomUUID(),
    });

    const savedLink = await this.repository.save(affiliateLink);
    return {
      message: 'Affiliate link created',
      affiliate_link: `${baseLink}${variantId ? `&variant=${variantId}` : ''}`,
      link_id: savedLink.id,
    };
  }

  async getMyLinks(userId: number) {
    console.log('userId', userId);

    const user = await this.userService.findOne(userId);
    console.log(JSON.stringify(user), null, 2);
    if (!user || user.is_affiliate != true) {
      console.log(
        'User is not an affiliate or does not exist',
        user.id,
        user.is_affiliate
      );
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
          affiliate_link: `http://localhost:4200/product/unknown?aff=${user.code}`,
          program_name: link.program_id?.name,
          created_at: link.created_at,
        };
      }

      const codeParts = link.code.split(':');
      const linkProductId = codeParts[1] || 'unknown';
      const linkVariantId = codeParts[2] ? parseInt(codeParts[2], 10) : undefined;
      const baseLink = `http://localhost:4200/product/${linkProductId}?aff=${user.code}`;

      return {
        link_id: link.id,
        productId: parseInt(linkProductId, 10),
        variantId: linkVariantId,
        affiliate_link: `${baseLink}${
          linkVariantId ? `&variant=${linkVariantId}` : ''
        }`,
        program_name: link.program_id?.name,
        created_at: link.created_at,
      };
    });

    return { message: 'Affiliate links retrieved', links: affiliateLinks };
  }

  async getAffiliatedProducts(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user || !user.is_affiliate) {
      throw new NotFoundException('User is not an affiliate or does not exist');
    }

    const commissions = await this.commissionRepository
      .createQueryBuilder('commission')
      .leftJoin('commission.link_id', 'link')
      .leftJoin('link.user_id', 'user')
      .leftJoinAndSelect('commission.order_item_id', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .where('user.id = :userId', { userId })
      .getMany();

    const products = commissions
      .map((comm) => comm.order_item_id?.product)
      .filter((p): p is Product => p !== null && p !== undefined);

    const uniqueProducts = [
      ...new Map(products.map((p) => [p.id, p])).values(),
    ];

    return {
      message: uniqueProducts.length
        ? 'Affiliated products retrieved'
        : 'No affiliated products found',
      products: uniqueProducts,
    };
  }

  async deleteMyLink(linkId: number, userId: number) {
    const link = await this.repository.findOne({
      where: { id: linkId },
      relations: ['user_id'],
    });
    if (!link) {
      throw new NotFoundException('Affiliate link not found');
    }
    if (!link.user_id || link.user_id.id !== userId) {
      throw new ForbiddenException('You are not allowed to delete this link');
    }

    await this.commissionRepository.delete({ link_id: { id: linkId } });

    await this.repository.remove(link);

    return { message: 'Affiliate link deleted', link_id: linkId };
  }
}
