// modules/affiliate-links/affiliate-links.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateLink } from './affiliate-links.entity';
import { AffiliateCommission } from '../affiliate-commissions/affiliate-commission.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';

@Injectable()
export class AffiliateLinksService {
  constructor(
    @InjectRepository(AffiliateLink) private readonly linkRepo: Repository<AffiliateLink>,
    @InjectRepository(AffiliateCommission) private readonly commRepo: Repository<AffiliateCommission>,
    @InjectRepository(AffiliateProgram) private readonly programRepo: Repository<AffiliateProgram>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async createAffiliateLink(userId: number, productId: number, variantId?: number, programId?: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!(user as any).is_affiliate) {
      throw new ForbiddenException('User is not an affiliate');
    }
    if (!(user as any).code) {
      throw new ForbiddenException('Affiliate code is missing');
    }

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    let program: AffiliateProgram | null = null;
    if (programId) {
      program = await this.programRepo.findOne({ where: { id: programId } });
      if (!program) throw new NotFoundException('Program not found');
    }

    // code dạng: AFF:{productId}:{variantId?}
    const code = `AFF:${productId}${variantId ? `:${variantId}` : ''}`;

    // kiểm tra duplicate theo user + code
    const existed = await this.linkRepo.findOne({ where: { code, user_id: { id: userId } as any } });
    const saved =
      existed ??
      (await this.linkRepo.save(
        this.linkRepo.create({
          user_id: user as any,
          program_id: program ?? null,
          code,
          created_at: new Date(),
        } as any),
      ));

    // Trả về URL theo origin production của bạn, frontend có thể normalize
    const affiliate_link = `https://everymart.com/product/${productId}?aff=${user.code}${
      variantId ? `&variant=${variantId}` : ''
    }`;

    return {
      link_id: (saved as any).id,
      affiliate_link,
      productId,
      variantId: variantId ?? undefined,
    };
  }

  async getMyLinks(userId: number) {
    const links = await this.linkRepo.find({
      where: { user_id: { id: userId } as any },
      relations: ['program_id', 'user_id'],
      order: { created_at: 'DESC' },
    });

    const mapped = links.map((l) => {
      const parts = (l.code || '').split(':');
      const pid = parts[1] ? Number(parts[1]) : undefined;
      const vid = parts[2] ? Number(parts[2]) : undefined;
      const affCode = ((l as any).user_id?.code as string) || '';
      return {
        link_id: l.id,
        productId: pid,
        variantId: vid,
        program_name: (l as any).program_id?.name,
        affiliate_link:
          pid && affCode
            ? `https://everymart.com/product/${pid}?aff=${affCode}${vid ? `&variant=${vid}` : ''}`
            : null,
        created_at: l.created_at,
      };
    });

    return { message: 'OK', links: mapped };
  }

  async deleteMyLink(linkId: number, userId: number) {
    const link = await this.linkRepo.findOne({ where: { id: linkId }, relations: ['user_id'] });
    if (!link) throw new NotFoundException('Affiliate link not found');
    if ((link as any).user_id?.id !== userId) throw new ForbiddenException('Not allowed');

    // Xoá commissions liên quan link (nếu cần)
    await this.commRepo.delete({ link_id: { id: linkId } as any });
    await this.linkRepo.remove(link);
    return { success: true, link_id: linkId };
  }

  async getAffiliatedProducts(userId: number) {
    // Tuỳ logic của bạn (ví dụ lấy theo link đã tạo)
    const links = await this.linkRepo.find({ where: { user_id: { id: userId } as any } });
    const productIds = new Set<number>();
    links.forEach((l) => {
      const parts = (l.code || '').split(':');
      const pid = parts[1] ? Number(parts[1]) : undefined;
      if (pid) productIds.add(pid);
    });

    if (productIds.size === 0) return { message: 'OK', products: [] };

    const products = await this.productRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids: Array.from(productIds) })
      .getMany();

    return { message: 'OK', products };
  }
}