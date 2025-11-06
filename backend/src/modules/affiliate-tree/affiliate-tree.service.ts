import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Referral } from '../referral/referrals.entity';
import { AffiliateCommission } from '../affiliate-commissions/affiliate-commission.entity';
import { AffiliateCommissionRule } from '../affiliate-rules/affiliate-rules.entity';
@Injectable()
export class AffiliateTreeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(AffiliateCommission)
    private readonly commissionRepository: Repository<AffiliateCommission>,
    @InjectRepository(AffiliateCommissionRule)
    private readonly rulesRepository: Repository<AffiliateCommissionRule>,
  ) {}

  async findAncestors(userId: number, maxDepth: number): Promise<number[]> {
    const query = `
      WITH RECURSIVE AncestorsCTE AS (
        -- Anchor member: the direct referrer of the starting user
        SELECT 
          referrer_id,
          1 AS level
        FROM 
          referrals
        WHERE 
          referee_id = ?

        UNION ALL

        -- Recursive member: join to find the next level up
        SELECT 
          r.referrer_id,
          ucte.level + 1
        FROM 
          referrals r
        INNER JOIN 
          AncestorsCTE ucte ON r.referee_id = ucte.referrer_id
        WHERE 
          ucte.level < ?
      )
      SELECT referrer_id FROM AncestorsCTE;
    `;

    const results: { referrer_id: number }[] = await this.referralRepository.query(query, [userId, maxDepth]);
    return results.map(r => r.referrer_id);
  }

  /**
   * Tìm những người được giới thiệu trực tiếp (cấp dưới) của một người dùng, có phân trang.
   * @param userId ID của người dùng cần tìm cấp dưới.
   * @param page Trang hiện tại.
   * @param limit Số lượng trên mỗi trang.
   * @returns Dữ liệu cấp dưới và tổng số lượng.
   */
  async findDescendants(userId: number, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [results, total] = await this.referralRepository.findAndCount({
      where: { referrer: { id: userId } },
      relations: ['referee'],
      skip: offset,
      take: limit,
    });

    const data = results.map(referral => ({
      userId: referral.referee.id,
      email: referral.referee.email,
      username: referral.referee.username,
      registeredAt: referral.created_at,
    }));

    return {
      data,
      total,
    };
  }

  /**
   * Lấy cây affiliate với thông tin commission cho từng user
   */
  // async getAffiliateTreeWithCommissions(userId: number, maxDepth: number = 10) {
  //   // Lấy ancestors với level
  //   const ancestorsQuery = `
  //     WITH RECURSIVE AncestorsCTE AS (
  //       SELECT 
  //         referrer_id,
  //         1 AS level
  //       FROM 
  //         referrals
  //       WHERE 
  //         referee_id = ?

  //       UNION ALL

  //       SELECT 
  //         r.referrer_id,
  //         ucte.level + 1
  //       FROM 
  //         referrals r
  //       INNER JOIN 
  //         AncestorsCTE ucte ON r.referee_id = ucte.referrer_id
  //       WHERE 
  //         ucte.level < ?
  //     )
  //     SELECT 
  //       referrer_id,
  //       level
  //     FROM AncestorsCTE
  //     ORDER BY level ASC;
  //   `;

  //   const ancestors = await this.referralRepository.query(ancestorsQuery, [userId, maxDepth]);

  //   // Lấy descendants với level
  //   const descendantsQuery = `
  //     WITH RECURSIVE DescendantsCTE AS (
  //       SELECT 
  //         referee_id,
  //         1 AS level
  //       FROM 
  //         referrals
  //       WHERE 
  //         referrer_id = ?

  //       UNION ALL

  //       SELECT 
  //         r.referee_id,
  //         dcte.level + 1
  //       FROM 
  //         referrals r
  //       INNER JOIN 
  //         DescendantsCTE dcte ON r.referrer_id = dcte.referee_id
  //       WHERE 
  //         dcte.level < ?
  //     )
  //     SELECT 
  //       referee_id,
  //       level
  //     FROM DescendantsCTE
  //     ORDER BY level ASC;
  //   `;

  //   const descendants = await this.referralRepository.query(descendantsQuery, [userId, maxDepth]);

  //   // Lấy thông tin user và commission cho tất cả user trong cây
  //   const allUserIds = [
  //     userId,
  //     ...ancestors.map(a => a.referrer_id),
  //     ...descendants.map(d => d.referee_id)
  //   ];

  //   const users = await this.userRepository.findByIds(allUserIds);
  //   const userMap = new Map(users.map(u => [u.id, u]));

  //   // Lấy commission summary cho mỗi user
  //   const commissionSummaries = await this.getCommissionSummaryForUsers(allUserIds);

  //   // Xây dựng cây với thông tin commission
  //   const buildTreeWithCommissions = (userIds: any[], levelOffset: number = 0) => {
  //     return userIds.map(item => {
  //       const user = userMap.get(item.referrer_id || item.referee_id);
  //       const level = (item.level || 0) + levelOffset;
  //       const commission = commissionSummaries.get(item.referrer_id || item.referee_id) || {
  //         totalEarned: 0,
  //         totalPending: 0,
  //         totalPaid: 0,
  //         currentLevel: level,
  //         ratePercent: 0
  //       };

  //       return {
  //         userId: item.referrer_id || item.referee_id,
  //         level,
  //         user: user ? {
  //           id: user.id,
  //           email: user.email,
  //           username: user.username,
  //           is_affiliate: user.is_affiliate
  //         } : null,
  //         commission: {
  //           ...commission,
  //           currentLevel: level
  //         }
  //       };
  //     });
  //   };

  //   return {
  //     rootUser: {
  //       userId,
  //       level: 0,
  //       user: userMap.get(userId) ? {
  //         id: userMap.get(userId)!.id,
  //         email: userMap.get(userId)!.email,
  //         username: userMap.get(userId)!.username,
  //         is_affiliate: userMap.get(userId)!.is_affiliate
  //       } : null,
  //       commission: commissionSummaries.get(userId) || {
  //         totalEarned: 0,
  //         totalPending: 0,
  //         totalPaid: 0,
  //         currentLevel: 0,
  //         ratePercent: 0
  //       }
  //     },
  //     ancestors: buildTreeWithCommissions(ancestors, -1), // Level âm cho ancestors
  //     descendants: buildTreeWithCommissions(descendants, 1) // Level dương cho descendants
  //   };
  // }

  /**
   * Lấy tổng kết commission cho danh sách users
   */
  async getCommissionSummaryForUsers(userIds: number[]) {
    const summaries = await this.commissionRepository
      .createQueryBuilder('c')
      .select([
        'c.beneficiary_user_id as userId',
        'SUM(CASE WHEN c.status = "PENDING" THEN c.amount ELSE 0 END) as totalPending',
        'SUM(CASE WHEN c.status = "PAID" THEN c.amount ELSE 0 END) as totalPaid',
        'SUM(c.amount) as totalEarned',
        'AVG(c.rate_percent) as avgRatePercent'
      ])
      .where('c.beneficiary_user_id IN (:...userIds)', { userIds })
      .groupBy('c.beneficiary_user_id')
      .getRawMany();

    const summaryMap = new Map();
    summaries.forEach(summary => {
      summaryMap.set(summary.userId, {
        totalEarned: parseFloat(summary.totalEarned) || 0,
        totalPending: parseFloat(summary.totalPending) || 0,
        totalPaid: parseFloat(summary.totalPaid) || 0,
        ratePercent: parseFloat(summary.avgRatePercent) || 0
      });
    });

    return summaryMap;
  }

  /**
   * Lấy commission rules hiện tại cho một level
   */
  async getCommissionRulesForLevel(level: number, programId?: number) {
    const query = this.rulesRepository
      .createQueryBuilder('r')
      .where('r.is_active = :isActive', { isActive: true })
      .orderBy('r.program_id', 'DESC');

    if (programId) {
      query.andWhere('(r.program_id = :programId OR r.program_id IS NULL)', { programId: programId.toString() });
    } else {
      query.andWhere('r.program_id IS NULL');
    }

    const rules = await query.getMany();
    
    // Find rules that contain the specified level in their calculated_rates
    const matchingRules = rules.filter(rule => 
      rule.calculated_rates && 
      rule.calculated_rates.some(rate => rate.level === level)
    );

    // Return the first matching rule (highest priority by program_id)
    if (matchingRules.length > 0) {
      const rule = matchingRules[0];
      const levelRate = rule.calculated_rates.find(rate => rate.level === level);
      return {
        ...rule,
        level_rate: levelRate
      };
    }

    return null;
  }

  /**
   * Admin quy định mức affiliate cho chuỗi người trong cây
   */
  // async setCommissionRulesForUsers(rules: any[], programId?: number) {
  //   const results = [];
    
  //   for (const rule of rules) {
  //     // Kiểm tra user có tồn tại không
  //     const user = await this.userRepository.findOne({ where: { id: rule.userId } });
  //     if (!user) {
  //       throw new Error(`User with ID ${rule.userId} not found`);
  //     }

  //     // Tạo hoặc cập nhật commission rule
  //     const existingRule = await this.rulesRepository.findOne({
  //       where: {
  //         level: rule.level,
  //         program_id: programId || null
  //       }
  //     });

  //     if (existingRule) {
  //       // Cập nhật rule hiện tại
  //       existingRule.rate_percent = String(rule.ratePercent);
  //       existingRule.cap_per_order = rule.capPerOrder ? String(rule.capPerOrder) : null;
  //       existingRule.cap_per_user = rule.capPerUser ? String(rule.capPerUser) : null;
  //       existingRule.active_from = rule.activeFrom ? new Date(rule.activeFrom) : null;
  //       existingRule.active_to = rule.activeTo ? new Date(rule.activeTo) : null;
        
  //       const updatedRule = await this.rulesRepository.save(existingRule);
  //       results.push({
  //         userId: rule.userId,
  //         level: rule.level,
  //         action: 'updated',
  //         rule: updatedRule
  //       });
  //     } else {
  //       // Tạo rule mới
  //       const newRule = this.rulesRepository.create({
  //         program_id: programId || null,
  //         level: rule.level,
  //         rate_percent: String(rule.ratePercent),
  //         cap_per_order: rule.capPerOrder ? String(rule.capPerOrder) : null,
  //         cap_per_user: rule.capPerUser ? String(rule.capPerUser) : null,
  //         active_from: rule.activeFrom ? new Date(rule.activeFrom) : null,
  //         active_to: rule.activeTo ? new Date(rule.activeTo) : null,
  //       });

  //       const savedRule = await this.rulesRepository.save(newRule);
  //       results.push({
  //         userId: rule.userId,
  //         level: rule.level,
  //         action: 'created',
  //         rule: savedRule
  //       });
  //     }
  //   }

  //   return results;
  // }

  /**
   * Lấy commission rules cho một chuỗi users
   */
  async getCommissionRulesForUsers(userIds: number[], programId?: number) {
    const query = this.rulesRepository
      .createQueryBuilder('r')
      .where('r.is_active = :isActive', { isActive: true });

    if (programId) {
      query.andWhere('(r.program_id = :programId OR r.program_id IS NULL)', { programId: programId.toString() });
    } else {
      query.andWhere('r.program_id IS NULL');
    }

    const rules = await query.getMany();
    
    // Return rules with their calculated_rates for the frontend to process
    return rules.map(rule => ({
      ...rule,
      // Include all calculated rates for each rule
      levels: rule.calculated_rates || []
    }));
  }
}