import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { AffiliateLink } from './affiliate-links.entity';

export interface AffiliateResolution {
  userId: number;
  programId?: number;
  isValid: boolean;
}

@Injectable()
export class AffiliateResolutionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AffiliateLink)
    private readonly linkRepo: Repository<AffiliateLink>,
  ) {}

  /**
   * Resolve affiliate code to user and link information
   */
  async resolveAffiliateCode(affiliateCode: string, productId?: number, variantId?: number): Promise<AffiliateResolution | null> {
    // Find user by affiliate code
    const user = await this.userRepo.findOne({
      where: { 
        code: affiliateCode,
        is_affiliate: true 
      }
    });

    if (!user) {
      return null;
    }

    const result: AffiliateResolution = {
      userId: user.id,
      isValid: true
    };

    // If product is specified, try to find specific affiliate link
    if (productId) {
      // Code format: AFF:{userId}:{productId}:{variantId?}
      const linkCode = `AFF:${user.id}:${productId}${variantId ? `:${variantId}` : ''}`;
      
      const link = await this.linkRepo.findOne({
        where: {
          code: linkCode,
          user_id: { id: user.id } as any
        },
        relations: ['program_id']
      });

      if (link) {
        result.programId = (link as any).program_id?.id;
      }
    } else {
      // 🎯 NEW: If no product specified, find any active affiliate link for this user
      // This ensures programId is always populated when resolving affiliate code
      const anyLink = await this.linkRepo.findOne({
        where: {
          user_id: { id: user.id } as any
        },
        relations: ['program_id'],
        order: { created_at: 'DESC' }
      });

      if (anyLink) {
        result.programId = (anyLink as any).program_id?.id;
        console.log(`✅ Resolved program from affiliate link: programId=${result.programId}`);
      } else {
        console.warn(`⚠️ No affiliate link found for user ${user.id}, programId will be null`);
      }
    }

    return result;
  }

  /**
   * Validate if affiliate code is active and valid
   */
  async validateAffiliateCode(affiliateCode: string): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { 
        code: affiliateCode,
        is_affiliate: true 
      }
    });

    return !!user;
  }

  /**
   * Get affiliate user by code
   */
  async getAffiliateByCode(affiliateCode: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { 
        code: affiliateCode,
        is_affiliate: true 
      }
    });
  }
}
