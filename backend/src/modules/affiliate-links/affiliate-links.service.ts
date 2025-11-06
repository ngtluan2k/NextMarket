// modules/affiliate-links/affiliate-links.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateLink } from './affiliate-links.entity';
import { AffiliateCommission } from '../affiliate-commissions/affiliate-commission.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AffiliateLinksService {
  constructor(
    @InjectRepository(AffiliateLink) private readonly linkRepo: Repository<AffiliateLink>,
    @InjectRepository(AffiliateCommission) private readonly commRepo: Repository<AffiliateCommission>,
    @InjectRepository(AffiliateProgram) private readonly programRepo: Repository<AffiliateProgram>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly walletService: WalletService,
  ) {}

  async createAffiliateLink(userId: number, productId: number, variantId?: number, programId?: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    // Auto-enable affiliate status and generate code if not exists
    if (!(user as any).is_affiliate || !(user as any).code) {
      const affiliateCode = (user as any).code || `AFF${userId}${Date.now().toString().slice(-4)}`;
      await this.userRepo.update(userId, {
        is_affiliate: true,
        code: affiliateCode,
        updated_at: new Date(),
      });
      console.log(`✅ Auto-enabled affiliate status for user ${userId} with code: ${affiliateCode}`);
    }

    // Ensure user has a wallet (auto-create if not exists)
    await this.walletService.createWalletIfNotExists(userId);

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
          uuid: uuidv4(),
          user_id: user as any,
          program_id: program ?? null,
          code,
          created_at: new Date(),
        } as any),
      ));

    // Trả về URL theo origin production của bạn, frontend có thể normalize
    const affiliate_link = `https://everymart.com/product/${productId}?aff=${user.code}${
      variantId ? `&variant=${variantId}` : ''
    }${programId ? `&program=${programId}` : ''}`;

    return {
      link_id: (saved as any).id,
      affiliate_link,
      productId,
      variantId: variantId ?? undefined,
      programId: programId ?? undefined,
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
      const programId = (l as any).program_id?.id;
      return {
        link_id: l.id,
        productId: pid,
        variantId: vid,
        programId: programId,
        program_name: (l as any).program_id?.name,
        affiliate_link:
          pid && affCode
            ? `https://everymart.com/product/${pid}?aff=${affCode}${vid ? `&variant=${vid}` : ''}${programId ? `&program=${programId}` : ''}`
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
    // Lấy theo link đã tạo
    const links = await this.linkRepo.find({ where: { user_id: { id: userId } as any } });
    const productIds = new Set<number>();
    links.forEach((l) => {
      const parts = (l.code || '').split(':');
      const pid = parts[1] ? Number(parts[1]) : undefined;
      if (pid) productIds.add(pid);
    });

    if (productIds.size === 0) return { message: 'OK', products: [] };

    // Lấy products kèm relations
    const products = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.media', 'media')
      .leftJoinAndSelect('p.store', 'store')
      .leftJoinAndSelect('p.variants', 'variants')
      .leftJoinAndSelect('p.brand', 'brand')
      .where('p.id IN (:...ids)', { ids: Array.from(productIds) })
      .getMany();

    return { message: 'OK', products };
  }

  async getDashboardStats(userId: number) {
    try {
      // Get total number of affiliate links created
      const totalLinks = await this.linkRepo.count({
        where: { user_id: { id: userId } as any },
      });

      // Get commission statistics - query directly by beneficiary_user_id
      const commissionStats = await this.commRepo
        .createQueryBuilder('c')
        .leftJoin('c.beneficiary_user_id', 'user')
        .where('user.id = :userId', { userId })
        .select([
          "COALESCE(SUM(CASE WHEN c.status = 'PENDING' THEN c.amount ELSE 0 END), 0) as totalPending",
          "COALESCE(SUM(CASE WHEN c.status = 'PAID' THEN c.amount ELSE 0 END), 0) as totalPaid",
          'COALESCE(SUM(c.amount), 0) as totalEarned',
          'COUNT(DISTINCT c.order_item_id) as totalOrders',
        ])
        .getRawOne();

      // Count unique buyers per link
      // Logic: 1 user buying multiple times through same link = 1 buyer
      //        1 user buying through different links = counted separately per link
      const buyersStats = await this.commRepo
        .createQueryBuilder('c')
        .leftJoin('c.beneficiary_user_id', 'beneficiary')
        .leftJoin('c.order_item_id', 'orderItem')
        .leftJoin('orderItem.order', 'order')
        .leftJoin('c.affiliate_link_id', 'link')
        .where('beneficiary.id = :userId', { userId })
        .andWhere('c.level = :level', { level: 1 }) // Only count direct purchases (level 1)
        .select([
          'COUNT(DISTINCT CONCAT(link.id, \'-\', order.user_id)) as totalBuyers'
        ])
        .getRawOne();

      const totalRevenue = parseFloat(commissionStats?.totalEarned || '0');
      const totalPending = parseFloat(commissionStats?.totalPending || '0');
      const totalPaid = parseFloat(commissionStats?.totalPaid || '0');
      const totalBuyers = parseInt(buyersStats?.totalBuyers || '0', 10);

      return {
        totalRevenue: totalRevenue.toFixed(2),
        totalPending: totalPending.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        totalLinks,
        totalBuyers,
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      // Return default values if query fails
      return {
        totalRevenue: '0.00',
        totalPending: '0.00',
        totalPaid: '0.00',
        totalLinks: 0,
        totalBuyers: 0,
      };
    }
  }

  /**
   * Get detailed commission history for a user
   */
  async getCommissionHistory(userId: number, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [commissions, total] = await this.commRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.beneficiary_user_id', 'user')
      .leftJoinAndSelect('c.order_item_id', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('orderItem.order', 'order')
      .leftJoinAndSelect('product.media', 'media')
      .where('user.id = :userId', { userId })
      .orderBy('c.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const formattedCommissions = commissions.map(commission => ({
      id: commission.id,
      amount: parseFloat(commission.amount.toString()),
      rate_percent: commission.rate_percent,
      status: commission.status,
      level: commission.level,
      created_at: commission.created_at,
      product: {
        id: (commission as any).order_item_id?.product?.id,
        name: (commission as any).order_item_id?.product?.name,
        image: (commission as any).order_item_id?.product?.media?.find((m: any) => m.is_primary)?.url || 
               (commission as any).order_item_id?.product?.media?.[0]?.url,
      },
      order: {
        id: (commission as any).order_item_id?.order?.id,
        order_number: (commission as any).order_item_id?.order?.order_number || `ORD-${(commission as any).order_item_id?.order?.id}`,
        total_amount: (commission as any).order_item_id?.order?.total_amount,
        created_at: (commission as any).order_item_id?.order?.created_at,
      },
      affiliate_link: {
        id: null, // No longer using affiliate links
        code: null,
      }
    }));

    return {
      commissions: formattedCommissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get commission summary by time periods
   */
  async getCommissionSummaryByPeriod(userId: number, period: 'daily' | 'weekly' | 'monthly' = 'monthly', limit: number = 12) {
    try {
      let dateFormat: string;

      switch (period) {
        case 'daily':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'weekly':
          dateFormat = 'IYYY-IW'; // ISO week format for PostgreSQL
          break;
        case 'monthly':
        default:
          dateFormat = 'YYYY-MM';
          break;
      }

      const summaries = await this.commRepo
        .createQueryBuilder('c')
        .leftJoin('c.beneficiary_user_id', 'user')
        .where('user.id = :userId', { userId })
        .select([
          `TO_CHAR(c.created_at, '${dateFormat}') as period`,
          "COALESCE(SUM(CASE WHEN c.status = 'PENDING' THEN c.amount ELSE 0 END), 0) as totalPending",
          "COALESCE(SUM(CASE WHEN c.status = 'PAID' THEN c.amount ELSE 0 END), 0) as totalPaid",
          'COALESCE(SUM(c.amount), 0) as totalEarned',
          'COUNT(c.id) as totalCommissions',
          'COUNT(DISTINCT c.order_item_id) as totalOrders',
        ])
        .groupBy('period')
        .orderBy('period', 'DESC')
        .limit(limit)
        .getRawMany();

      return summaries.map(summary => ({
        period: summary.period,
        totalEarned: parseFloat(summary.totalEarned || '0'),
        totalPending: parseFloat(summary.totalPending || '0'),
        totalPaid: parseFloat(summary.totalPaid || '0'),
        totalCommissions: parseInt(summary.totalCommissions || '0', 10),
        totalOrders: parseInt(summary.totalOrders || '0', 10),
      }));
    } catch (error) {
      console.error('Error in getCommissionSummaryByPeriod:', error);
      // Return empty array if query fails
      return [];
    }
  }

  /**
   * Get available balance for withdrawal
   */
  async getAvailableBalance(userId: number) {
    try {
      const balanceStats = await this.commRepo
        .createQueryBuilder('c')
        .leftJoin('c.beneficiary_user_id', 'user')
        .where('user.id = :userId', { userId })
        .select([
          "COALESCE(SUM(CASE WHEN c.status = 'PAID' THEN c.amount ELSE 0 END), 0) as availableBalance",
          "COALESCE(SUM(CASE WHEN c.status = 'PENDING' THEN c.amount ELSE 0 END), 0) as pendingBalance",
          'COALESCE(SUM(c.amount), 0) as totalEarned',
        ])
        .getRawOne();

      return {
        availableBalance: parseFloat(balanceStats?.availableBalance || '0'),
        pendingBalance: parseFloat(balanceStats?.pendingBalance || '0'),
        totalEarned: parseFloat(balanceStats?.totalEarned || '0'),
      };
    } catch (error) {
      console.error('Error in getAvailableBalance:', error);
      // Return default values if query fails
      return {
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
      };
    }
  }

  /**
   * Search products for affiliate link creation
   */
  async searchProductsForAffiliate(userId: number, query: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    // Auto-enable affiliate status if not exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    if (!(user as any).is_affiliate || !(user as any).code) {
      const affiliateCode = (user as any).code || `AFF${userId}${Date.now().toString().slice(-4)}`;
      await this.userRepo.update(userId, {
        is_affiliate: true,
        code: affiliateCode,
        updated_at: new Date(),
      });
      console.log(`✅ Auto-enabled affiliate status for user ${userId} with code: ${affiliateCode}`);
    }

    const [products, total] = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.media', 'media')
      .leftJoinAndSelect('p.store', 'store')
      .leftJoinAndSelect('p.variants', 'variants')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.categories', 'categories')
      .leftJoinAndSelect('categories.category', 'category')
      .where('p.name LIKE :query OR p.description LIKE :query', { query: `%${query}%` })
      .andWhere('p.status = :status', { status: 'active' })
      .orderBy('p.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const formattedProducts = products.map(product => {
      // Get primary image or first available image
      const primaryImage = product.media?.find(m => m.is_primary)?.url;
      const firstImage = product.media?.[0]?.url;
      const productImage = primaryImage || firstImage;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        base_price: product.base_price,
        image: productImage,
        media: product.media?.map(m => ({
          id: m.id,
          url: m.url,
          media_type: m.media_type,
          is_primary: m.is_primary,
          sort_order: m.sort_order,
        })) || [],
        store: {
          id: product.store?.id,
          name: product.store?.name,
        },
        brand: {
          id: product.brand?.id,
          name: product.brand?.name,
        },
        categories: product.categories?.map(pc => ({
          id: pc.id,
          name: pc.category?.name,
        })) || [],
        variants: product.variants?.map(variant => ({
          id: variant.id,
          name: variant.variant_name,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
        })) || [],
      };
    });

    return {
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }
}