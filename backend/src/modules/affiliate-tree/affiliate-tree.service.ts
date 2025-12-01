import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../user/user.entity';
import { Referral } from '../referral/referrals.entity';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';
import { AffiliateCommissionRule } from '../affiliate-rules/affiliate-rules.entity';
import { AffiliateProgramParticipant } from '../affiliate-program/affiliate-program-participant.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { OrderStatuses } from '../orders/types/orders';

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
    @InjectRepository(AffiliateProgramParticipant)
    private readonly participantRepository: Repository<AffiliateProgramParticipant>,
    @InjectRepository(AffiliateProgram)
    private readonly programRepository: Repository<AffiliateProgram>,
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
          referee_id = $1

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
          ucte.level < $2
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
   * @param userId - User ID to get tree for
   * @param maxDepth - Maximum depth of tree
   * @param programId - Optional program ID to filter rates and participation
   */
  async getAffiliateTreeWithCommissions(userId: number, maxDepth = 10, programId?: number) {
    // Lấy ancestors với level
    const ancestorsQuery = `
      WITH RECURSIVE AncestorsCTE AS (
        SELECT 
          referrer_id,
          1 AS level
        FROM 
          referrals
        WHERE 
          referee_id = $1

        UNION ALL

        SELECT 
          r.referrer_id,
          ucte.level + 1
        FROM 
          referrals r
        INNER JOIN 
          AncestorsCTE ucte ON r.referee_id = ucte.referrer_id
        WHERE 
          ucte.level < $2
      )
      SELECT 
        referrer_id,
        level
      FROM AncestorsCTE
      ORDER BY level ASC;
    `;

    const ancestors = await this.referralRepository.query(ancestorsQuery, [userId, maxDepth]);

    // Lấy descendants với level
    const descendantsQuery = `
      WITH RECURSIVE DescendantsCTE AS (
        SELECT 
          referee_id,
          1 AS level
        FROM 
          referrals
        WHERE 
          referrer_id = $1

        UNION ALL

        SELECT 
          r.referee_id,
          dcte.level + 1
        FROM 
          referrals r
        INNER JOIN 
          DescendantsCTE dcte ON r.referrer_id = dcte.referee_id
        WHERE 
          dcte.level < $2
      )
      SELECT 
        referee_id,
        level
      FROM DescendantsCTE
      ORDER BY level ASC;
    `;

    const descendants = await this.referralRepository.query(descendantsQuery, [userId, maxDepth]);

    // Lấy thông tin user và commission cho tất cả user trong cây
    const allUserIds = [
      userId,
      ...ancestors.map((a: any) => a.referrer_id),
      ...descendants.map((d: any) => d.referee_id)
    ];

    const users = await this.userRepository.findBy({ id: In(allUserIds) });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Lấy commission summary cho mỗi user
    const commissionSummaries = await this.getCommissionSummaryForUsers(allUserIds);

    // Xây dựng cây với thông tin commission
    const buildTreeWithCommissions = async (userIds: any[], levelOffset = 0) => {
      const results = [];
      
      for (const item of userIds) {
        const currentUserId = item.referrer_id || item.referee_id;
        const user = userMap.get(currentUserId);
        const level = Math.abs((item.level || 0) + levelOffset); // Lấy absolute level
        
        console.log(`[DEBUG] Processing user ${currentUserId}, checking commission summary...`);
        const commissionFromMap = commissionSummaries.get(currentUserId);
        console.log(`[DEBUG] Commission from map for user ${currentUserId}:`, commissionFromMap);
        
        const commission = commissionFromMap || {
          totalEarned: 0,
          totalPending: 0,
          totalPaid: 0,
          currentLevel: level,
          ratePercent: 0
        };
        
        console.log(`[DEBUG] Final commission for user ${currentUserId}:`, commission);

        // Nếu có programId: Check participation và lấy rate từ rules
        let programParticipation = null;
        if (programId) {
          const isJoined = await this.checkProgramParticipation(currentUserId, programId);
          let ratePercent = 0;
          let earnedFromProgram = 0;

          if (isJoined) {
            // Lấy rate từ rules của program này
            try {
              const ruleForLevel = await this.getCommissionRulesForLevel(level, programId);
              console.log(`[DEBUG] Rule for level ${level}, program ${programId}:`, ruleForLevel);
              if (ruleForLevel && ruleForLevel.level_rate) {
                console.log(`[DEBUG] Level rate found:`, ruleForLevel.level_rate);
                ratePercent = parseFloat(String(ruleForLevel.level_rate.rate)) || 0;
                console.log(`[DEBUG] Parsed ratePercent:`, ratePercent);
              } else {
                console.warn(`[DEBUG] No level_rate found for level ${level}, program ${programId}`);
              }
            } catch (error) {
              console.warn(`Could not fetch commission rule for level ${level}, program ${programId}:`, error);
            }

            // Lấy commission đã nhận từ program này
            const programCommission = await this.getCommissionFromProgram(currentUserId, programId);
            earnedFromProgram = programCommission.totalEarned;
          }

          programParticipation = {
            isJoined,
            rate: ratePercent,
            earnedFromProgram
          };
        }

        results.push({
          userId: currentUserId,
          level: (item.level || 0) + levelOffset, // Giữ nguyên level âm/dương cho ancestors/descendants
          user: user ? {
            id: user.id,
            email: user.email,
            username: user.username,
            is_affiliate: user.is_affiliate
          } : null,
          commission: {
            ...commission,
            currentLevel: level,
            ratePercent: programParticipation?.rate || commission.ratePercent // Rate từ program hoặc average
          },
          programParticipation // Null nếu không có programId filter
        });
      }
      
      return results;
    };

    // Lấy commission rate cho root user (level 0)
    const rootCommission = commissionSummaries.get(userId) || {
      totalEarned: 0,
      totalPending: 0,
      totalPaid: 0,
      currentLevel: 0,
      ratePercent: 0
    };

    // Nếu có programId: Check participation và lấy rate từ rules
    let rootProgramParticipation = null;
    if (programId) {
      const isJoined = await this.checkProgramParticipation(userId, programId);
      let ratePercent = 0;
      let earnedFromProgram = 0;

      if (isJoined) {
        try {
          const rootRule = await this.getCommissionRulesForLevel(0, programId);
          if (rootRule && rootRule.level_rate) {
            ratePercent = parseFloat(String(rootRule.level_rate.rate)) || 0;
          }
        } catch (error) {
          console.warn('Could not fetch commission rule for root level 0:', error);
        }

        const programCommission = await this.getCommissionFromProgram(userId, programId);
        earnedFromProgram = programCommission.totalEarned;
      }

      rootProgramParticipation = {
        isJoined,
        rate: ratePercent,
        earnedFromProgram
      };
    }

    return {
      rootUser: {
        userId,
        level: 0,
        user: userMap.get(userId) ? {
          id: userMap.get(userId)!.id,
          email: userMap.get(userId)!.email,
          username: userMap.get(userId)!.username,
          is_affiliate: userMap.get(userId)!.is_affiliate
        } : null,
        commission: {
          ...rootCommission,
          ratePercent: rootProgramParticipation?.rate || rootCommission.ratePercent
        },
        programParticipation: rootProgramParticipation
      },
      ancestors: await buildTreeWithCommissions(ancestors, -1), // Level âm cho ancestors
      descendants: await buildTreeWithCommissions(descendants, 1) // Level dương cho descendants
    };
  }

  /**
   * Lấy tổng kết commission cho danh sách users
   */
  async getCommissionSummaryForUsers(userIds: number[]) {
    console.log(`🔍 [getCommissionSummaryForUsers] Called with userIds:`, userIds);
    
    if (!userIds || userIds.length === 0) {
      console.log(`⚠️ [getCommissionSummaryForUsers] No userIds provided`);
      return new Map();
    }

    try {
      // Simplified query to avoid complex aggregations that might fail
      const summaries = await this.commissionRepository
        .createQueryBuilder('c')
        .select([
          'c.beneficiary_user_id as userId',
          'SUM(c.amount) as totalEarned',
          'COUNT(c.id) as totalCount'
        ])
        .where('c.beneficiary_user_id IN (:...userIds)', { userIds })
        .groupBy('c.beneficiary_user_id')
        .getRawMany();

      console.log(`📊 [getCommissionSummaryForUsers] Commission summaries found:`, summaries);

      const summaryMap = new Map();
      summaries.forEach(summary => {
        // Handle case sensitivity - PostgreSQL returns lowercase column names
        const userId = parseInt(summary.userid || summary.userId);
        const totalEarned = parseFloat(summary.totalearned || summary.totalEarned) || 0;
        
        const data = {
          totalEarned,
          totalPending: 0, // Simplified for now
          totalPaid: totalEarned, // Assume all are paid for now
          ratePercent: 0
        };
        
        console.log(`[DEBUG] Setting summary for user ${userId}:`, data);
        summaryMap.set(userId, data);
      });

      // Ensure all requested users have entries
      userIds.forEach(userId => {
        if (!summaryMap.has(userId)) {
          summaryMap.set(userId, {
            totalEarned: 0,
            totalPending: 0,
            totalPaid: 0,
            ratePercent: 0
          });
        }
      });

      console.log(`[DEBUG] Final summaryMap:`, Array.from(summaryMap.entries()));
      return summaryMap;

    } catch (error) {
      console.error(`❌ [getCommissionSummaryForUsers] Error:`, error);
      // Return empty map with default values for all users
      const summaryMap = new Map();
      userIds.forEach(userId => {
        summaryMap.set(userId, {
          totalEarned: 0,
          totalPending: 0,
          totalPaid: 0,
          ratePercent: 0
        });
      });
      return summaryMap;
    }
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

  /**
   * Check if user has joined a specific program
   */
  async checkProgramParticipation(userId: number, programId: number): Promise<boolean> {
    const participant = await this.participantRepository.findOne({
      where: {
        user_id: userId,
        program_id: programId,
        status: 'active'
      }
    });
    return !!participant;
  }

  /**
   * Get all programs a user has joined
   */
  async getUserPrograms(userId: number): Promise<AffiliateProgramParticipant[]> {
    return this.participantRepository.find({
      where: {
        user_id: userId,
        status: 'active'
      },
      relations: ['program']
    });
  }

  /**
   * Get program participation info for multiple users and programs
   */
  async getBulkProgramParticipation(userIds: number[], programIds: number[]): Promise<Map<string, Set<number>>> {
    const participants = await this.participantRepository.find({
      where: {
        user_id: In(userIds),
        program_id: In(programIds),
        status: 'active'
      }
    });

    // Map: userId -> Set of programIds
    const participationMap = new Map<string, Set<number>>();
    participants.forEach(p => {
      const key = String(p.user_id);
      if (!participationMap.has(key)) {
        participationMap.set(key, new Set());
      }
      participationMap.get(key)!.add(p.program_id);
    });

    return participationMap;
  }

  /**
   * Get commission earned from a specific program for a user
   */
  async getCommissionFromProgram(userId: number, programId: number) {
    console.log(`🔍 [getCommissionFromProgram] Called for userId: ${userId}, programId: ${programId}`);
    
    const result = await this.commissionRepository
      .createQueryBuilder('c')
      .select([
        "SUM(CASE WHEN c.status = 'PENDING' THEN c.amount ELSE 0 END) as totalPending",
        "SUM(CASE WHEN c.status = 'PAID' THEN c.amount ELSE 0 END) as totalPaid",
        'SUM(c.amount) as totalEarned'
      ])
      .where('c.beneficiary_user_id = :userId', { userId })
      .andWhere('c.program_id = :programId', { programId })
      .getRawOne();

    console.log(`📊 [getCommissionFromProgram] Result for user ${userId}, program ${programId}:`, result);

    const summary = {
      totalEarned: parseFloat(result?.totalearned || result?.totalEarned) || 0,
      totalPending: parseFloat(result?.totalpending || result?.totalPending) || 0,
      totalPaid: parseFloat(result?.totalpaid || result?.totalPaid) || 0
    };
    
    console.log(`✅ [getCommissionFromProgram] Final summary:`, summary);
    return summary;
  }

  /**
   * USER-SPECIFIC METHODS - Privacy compliant methods for affiliate users
   */

  /**
   * Get user's downline tree with privacy-compliant data filtering
   * @param userId - User ID to get downlines for
   * @param maxDepth - Maximum depth to traverse (default: 5)
   * @param programId - Optional program filter
   */
  async getUserDownlineTree(userId: number, maxDepth = 5, programId?: number) {
    console.log(`🔍 [getUserDownlineTree] Called for userId: ${userId}, maxDepth: ${maxDepth}, programId: ${programId}`);
    
    try {
      // Get descendants with level using recursive query
      // IMPORTANT: Exclude the current user from results to prevent self-reference
      const descendantsQuery = `
        WITH RECURSIVE DescendantsCTE AS (
          SELECT 
            referee_id,
            1 AS level,
            created_at
          FROM 
            referrals
          WHERE 
            referrer_id = $1
            AND referee_id != $1

          UNION ALL

          SELECT 
            r.referee_id,
            dcte.level + 1,
            r.created_at
          FROM 
            referrals r
          INNER JOIN 
            DescendantsCTE dcte ON r.referrer_id = dcte.referee_id
          WHERE 
            dcte.level < $2
            AND r.referee_id != $1
        )
        SELECT 
          referee_id,
          level,
          created_at
        FROM DescendantsCTE
        ORDER BY level ASC, created_at ASC;
      `;

      const descendants = await this.referralRepository.query(descendantsQuery, [userId, maxDepth]);
      console.log(`📊 [getUserDownlineTree] Found ${descendants.length} descendants`);

      if (descendants.length === 0) {
        return {
          totalDownlines: 0,
          activeDownlines: 0,
          totalRevenue: 0,
          tree: []
        };
      }

      // Get user info for all descendants
      const descendantIds = descendants.map((d: any) => d.referee_id);
      const users = await this.userRepository.findBy({ id: In(descendantIds) });
      const userMap = new Map(users.map(u => [u.id, u]));

      // Get commission summaries for descendants - with error handling
      let commissionSummaries = new Map();
      try {
        commissionSummaries = await this.getCommissionSummaryForUsers(descendantIds);
      } catch (commissionError) {
        console.warn(`⚠️ [getUserDownlineTree] Commission summary error:`, commissionError);
      }

      // Build simplified tree data without complex activity queries
      const treeData = [];
      let totalRevenue = 0;
      let activeCount = 0;

      for (const descendant of descendants) {
        const userId = descendant.referee_id;
        const user = userMap.get(userId);
        const commission = commissionSummaries.get(userId) || {
          totalEarned: 0,
          totalPending: 0,
          totalPaid: 0,
          ratePercent: 0
        };

        // Simplified downline info without complex activity tracking
        const downlineInfo = {
          affiliateCode: user?.code || `AFF${userId}`,
          level: parseInt(descendant.level),
          joinedDate: descendant.created_at,
          
          // Performance metrics (simplified)
          totalOrders: 0, // Simplified for now
          totalRevenue: commission.totalEarned || 0,
          totalCommissionGenerated: commission.totalEarned,
          
          // Activity status (simplified)
          status: commission.totalEarned > 0 ? 'active' : 'inactive',
          lastOrderDate: null,
          
          // Network metrics
          directReferrals: 0,
          totalDownlines: 0,
          
          // Performance tier (based on commission)
          performanceTier: this.calculatePerformanceTier(commission.totalEarned || 0)
        };

        if (downlineInfo.status === 'active') activeCount++;
        totalRevenue += downlineInfo.totalRevenue;

        treeData.push(downlineInfo);
      }

      // Calculate network metrics for each downline
      for (const item of treeData) {
        const currentLevel = item.level;
        
        // Count direct referrals (F1s)
        item.directReferrals = treeData.filter(d => d.level === currentLevel + 1).length;
        
        // Count total downlines (all levels below)
        item.totalDownlines = treeData.filter(d => d.level > currentLevel).length;
      }

      console.log(`✅ [getUserDownlineTree] Processed ${treeData.length} downlines, ${activeCount} active, total revenue: ${totalRevenue}`);

      return {
        totalDownlines: treeData.length,
        activeDownlines: activeCount,
        totalRevenue,
        tree: treeData
      };

    } catch (error) {
      console.error(`❌ [getUserDownlineTree] Error:`, error);
      return {
        totalDownlines: 0,
        activeDownlines: 0,
        totalRevenue: 0,
        tree: []
      };
    }
  }

  /**
   * Calculate performance tier based on revenue
   */
  private calculatePerformanceTier(revenue: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (revenue >= 50000000) return 'platinum'; // 50M VND
    if (revenue >= 20000000) return 'gold';     // 20M VND
    if (revenue >= 5000000) return 'silver';    // 5M VND
    return 'bronze';
  }

  /**
   * Get user's own affiliate statistics
   */
  async getUserAffiliateStats(userId: number) {
    console.log(`🔍 [getUserAffiliateStats] Called for userId: ${userId}`);

    try {
      // Get basic downline counts by level - simplified query
      const levelCountsQuery = `
        WITH RECURSIVE DescendantsCTE AS (
          SELECT 
            referee_id,
            1 AS level
          FROM 
            referrals
          WHERE 
            referrer_id = $1

          UNION ALL

          SELECT 
            r.referee_id,
            dcte.level + 1
          FROM 
            referrals r
          INNER JOIN 
            DescendantsCTE dcte ON r.referrer_id = dcte.referee_id
          WHERE 
            dcte.level < 10
        )
        SELECT 
          level,
          COUNT(*) as count
        FROM DescendantsCTE
        GROUP BY level
        ORDER BY level;
      `;

      const levelCounts = await this.referralRepository.query(levelCountsQuery, [userId]);
      console.log(`📊 [getUserAffiliateStats] Level counts:`, levelCounts);
      
      // Get commission summary for user - with error handling
      let userCommission = {
        totalEarned: 0,
        totalPending: 0,
        totalPaid: 0,
        ratePercent: 0
      };

      try {
        const commissionSummary = await this.getCommissionSummaryForUsers([userId]);
        userCommission = commissionSummary.get(userId) || userCommission;
      } catch (commissionError) {
        console.warn(`⚠️ [getUserAffiliateStats] Commission summary error:`, commissionError);
      }

      // Get recent performance (last 30 days) - simplified query
      let performance: any = {
        recent_orders: '0',
        recent_revenue: '0'
      };
      try {
        const recentPerformanceQuery = `
          SELECT 
            COUNT(DISTINCT o.id) as recent_orders,
            COALESCE(SUM(o.total_amount), 0) as recent_revenue
          FROM orders o
          WHERE o.created_at >= NOW() - INTERVAL '30 days'
            AND o.status = ${OrderStatuses.completed}
            AND o.affiliate_user_id = $1
        `;

        const recentPerformance = await this.userRepository.query(recentPerformanceQuery, [userId]);
        performance = recentPerformance[0] || performance;
        console.log(`📈 [getUserAffiliateStats] Performance:`, performance);
      } catch (performanceError) {
        console.warn(`⚠️ [getUserAffiliateStats] Performance query error:`, performanceError);
      }

      const result = {
        levelBreakdown: levelCounts.map((lc: any) => ({
          level: parseInt(lc.level),
          count: parseInt(lc.count)
        })),
        totalDownlines: levelCounts.reduce((sum: number, lc: any) => sum + parseInt(lc.count), 0),
        commission: userCommission,
        recentPerformance: {
          orders: parseInt(performance.recent_orders || '0'),
          revenue: parseFloat(performance.recent_revenue || '0'),
          commissions: 0, // Simplified for now
          commissionAmount: userCommission.totalEarned || 0
        }
      };

      console.log(`✅ [getUserAffiliateStats] Result:`, result);
      return result;

    } catch (error) {
      console.error(`❌ [getUserAffiliateStats] Error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get affiliate stats: ${errorMessage}`);
    }
  }

  /**
   * Get entire affiliate tree from root node (OPTIMIZED - NO commission data)
   * Commission data loaded separately on demand for better performance
   * @param maxDepth - Maximum depth of tree
   * @returns Complete tree structure with all users (without commission)
   */
  async getFullAffiliateTree(maxDepth = 10) {
    console.log(`🌳 [getFullAffiliateTree] Starting to fetch full affiliate tree with maxDepth: ${maxDepth}`);

    try {
      // OPTIMIZED: Single query that finds root AND fetches entire tree
      // Includes children count to avoid separate queries
      // FIX: Added WITH RECURSIVE because TreeCTE references itself
      const treeQuery = `
        WITH RECURSIVE RootUser AS (
          -- Find root user (user with no referrer) - OPTIMIZED: LEFT JOIN instead of NOT IN
          SELECT u.id, u.email, u.username
          FROM users u
          LEFT JOIN referrals r ON u.id = r.referee_id
          WHERE r.referee_id IS NULL
          LIMIT 1
        ),
        TreeCTE AS (
          -- Anchor: root user
          SELECT 
            u.id,
            u.email,
            u.username,
            0 AS level,
            CAST(u.id AS VARCHAR) AS path,
            (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as children_count
          FROM users u
          WHERE u.id = (SELECT id FROM RootUser)

          UNION ALL

          -- Recursive: all descendants
          SELECT 
            u.id,
            u.email,
            u.username,
            tcte.level + 1,
            tcte.path || ',' || CAST(u.id AS VARCHAR),
            (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id)
          FROM users u
          INNER JOIN referrals r ON u.id = r.referee_id
          INNER JOIN TreeCTE tcte ON r.referrer_id = tcte.id
          WHERE tcte.level < $1
        )
        SELECT 
          id,
          email,
          username,
          level,
          path,
          children_count
        FROM TreeCTE
        ORDER BY level ASC, id ASC
      `;

      const treeUsers = await this.referralRepository.query(treeQuery, [maxDepth]);
      console.log(`✅ [getFullAffiliateTree] Fetched ${treeUsers.length} users from tree in single query`);

      if (!treeUsers || treeUsers.length === 0) {
        console.warn(`⚠️ [getFullAffiliateTree] No users found in tree`);
        return {
          rootUser: null,
          tree: []
        };
      }

      // Build tree structure WITHOUT commission data (lazy loaded on demand)
      const treeStructure = treeUsers.map((user: any) => ({
        userId: user.id,
        email: user.email,
        username: user.username,
        level: user.level,
        path: user.path,
        childrenCount: user.children_count || 0,
        // Commission data NOT included - loaded separately via getNodeCommissionDetails()
      }));

      console.log(`✅ [getFullAffiliateTree] Tree built successfully with ${treeStructure.length} nodes (NO commission data - lazy loaded)`);

      return {
        rootUser: treeStructure[0],
        tree: treeStructure
      };

    } catch (error) {
      console.error(`❌ [getFullAffiliateTree] Error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get full affiliate tree: ${errorMessage}`);
    }
  }

  /**
   * Get commission details for a specific user (lazy loaded on demand)
   * Called only when admin clicks on a node
   * @param userId - User ID to fetch commission for
   * @returns Commission details for the user
   */
  async getNodeCommissionDetails(userId: number) {
    console.log(`💰 [getNodeCommissionDetails] Fetching commission for user: ${userId}`);

    try {
      const commissionSummary = await this.getCommissionSummaryForUsers([userId]);
      const commission = commissionSummary.get(userId) || {
        totalEarned: 0,
        totalPending: 0,
        totalPaid: 0,
        ratePercent: 0
      };

      console.log(`✅ [getNodeCommissionDetails] Commission fetched for user ${userId}`);
      return commission;

    } catch (error) {
      console.error(`❌ [getNodeCommissionDetails] Error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get commission details: ${errorMessage}`);
    }
  }

  /**
   * Get user details by ID (OPTIMIZED - single query)
   * @param userId - User ID to fetch
   * @returns User details with referral counts (commission loaded separately)
   */
  async getUserTreeNodeDetails(userId: number) {
    console.log(`👤 [getUserTreeNodeDetails] Fetching details for user: ${userId}`);

    try {
      // OPTIMIZED: Single query that gets all user details including referral counts
      const userDetailsQuery = `
        SELECT 
          u.id,
          u.email,
          u.username,
          u.created_at,
          (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as direct_referrals,
          (
            WITH RECURSIVE DescendantsCTE AS (
              SELECT referee_id, 1 AS level
              FROM referrals
              WHERE referrer_id = u.id

              UNION ALL

              SELECT r.referee_id, dcte.level + 1
              FROM referrals r
              INNER JOIN DescendantsCTE dcte ON r.referrer_id = dcte.referee_id
              WHERE dcte.level < 100
            )
            SELECT COUNT(DISTINCT referee_id)
            FROM DescendantsCTE
          ) as total_downlines
        FROM users u
        WHERE u.id = $1
      `;

      const result = await this.userRepository.query(userDetailsQuery, [userId]);

      if (!result || result.length === 0) {
        throw new Error(`User ${userId} not found`);
      }

      const userDetails = result[0];

      // Get commission separately (lazy loaded)
      const commission = await this.getNodeCommissionDetails(userId);

      const finalResult = {
        id: userDetails.id,
        email: userDetails.email,
        username: userDetails.username,
        createdAt: userDetails.created_at,
        commission,
        directReferrals: userDetails.direct_referrals || 0,
        totalDownlines: userDetails.total_downlines || 0
      };

      console.log(`✅ [getUserTreeNodeDetails] Details fetched for user ${userId} in single query`);
      return finalResult;

    } catch (error) {
      console.error(`❌ [getUserTreeNodeDetails] Error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get user tree node details: ${errorMessage}`);
    }
  }
}