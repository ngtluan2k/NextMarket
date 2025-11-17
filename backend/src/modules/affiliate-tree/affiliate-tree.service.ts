import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../user/user.entity';
import { Referral } from '../referral/referrals.entity';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';
import { AffiliateCommissionRule } from '../affiliate-rules/affiliate-rules.entity';
import { AffiliateProgramParticipant } from '../affiliate-program/affiliate-program-participant.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';

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
    
    // First, let's check if there are any commissions at all
    const allCommissions = await this.commissionRepository
      .createQueryBuilder('c')
      .select(['c.id', 'c.amount', 'c.status', 'c.beneficiary_user_id'])
      .getRawMany();
    
    console.log(`📊 [getCommissionSummaryForUsers] Total commissions in DB:`, allCommissions.length);
    console.log(`📋 [getCommissionSummaryForUsers] Sample commissions:`, allCommissions.slice(0, 3));
    
    // Check commissions for specific users
    const userCommissions = await this.commissionRepository
      .createQueryBuilder('c')
      .select(['c.id', 'c.amount', 'c.status', 'c.beneficiary_user_id'])
      .where('c.beneficiary_user_id IN (:...userIds)', { userIds })
      .getRawMany();
    
    console.log(`🎯 [getCommissionSummaryForUsers] Commissions for target users:`, userCommissions.length);
    console.log(`📋 [getCommissionSummaryForUsers] Target user commissions:`, userCommissions);
    
    const summaries = await this.commissionRepository
      .createQueryBuilder('c')
      .select([
        'c.beneficiary_user_id as userId',
        "SUM(CASE WHEN c.status = 'PENDING' THEN c.amount ELSE 0 END) as totalPending",
        "SUM(CASE WHEN c.status = 'PAID' THEN c.amount ELSE 0 END) as totalPaid",
        'SUM(c.amount) as totalEarned',
        'AVG(c.rate_percent) as avgRatePercent'
      ])
      .where('c.beneficiary_user_id IN (:...userIds)', { userIds })
      .groupBy('c.beneficiary_user_id')
      .getRawMany();

    console.log(`📊 [getCommissionSummaryForUsers] Commission summaries found:`, summaries);

    const summaryMap = new Map();
    summaries.forEach(summary => {
      // Fix case sensitivity - PostgreSQL returns lowercase column names
      const userId = parseInt(summary.userid || summary.userId);
      const data = {
        totalEarned: parseFloat(summary.totalearned || summary.totalEarned) || 0,
        totalPending: parseFloat(summary.totalpending || summary.totalPending) || 0,
        totalPaid: parseFloat(summary.totalpaid || summary.totalPaid) || 0,
        ratePercent: parseFloat(summary.avgratepercent || summary.avgRatePercent) || 0
      };
      console.log(`[DEBUG] Setting summary for user ${userId}:`, data);
      console.log(`[DEBUG] Raw summary object:`, summary);
      summaryMap.set(userId, data);
    });

    console.log(`[DEBUG] Final summaryMap:`, Array.from(summaryMap.entries()));
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
}