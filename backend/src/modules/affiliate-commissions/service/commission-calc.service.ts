// modules/affiliate-commissions/commission-calc.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities
import { Order } from '../../orders/order.entity';
import { OrderItem } from '../../order-items/order-item.entity';
import { AffiliateCommission } from '../entity/affiliate-commission.entity';
import { Referral } from '../../referral/referrals.entity';

// Services
import { AffiliateRulesService } from '../../affiliate-rules/affiliate-rules.service';
import { WalletService } from '../../wallet/wallet.service';
import { FraudDetectionService } from '../../affiliate-fraud/service/fraud-detection.service';
import { BudgetTrackingService } from '../../affiliate-program/service/budget-tracking.service';
import { User } from '../../user/user.entity';
import { AffiliateProgram } from '../../affiliate-program/affiliate-program.entity';
import { AffiliateTreeService } from '../../affiliate-tree/affiliate-tree.service';

@Injectable()
export class CommissionCalcService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(AffiliateCommission)
    private readonly commRepo: Repository<AffiliateCommission>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AffiliateProgram)
    private readonly programRepo: Repository<AffiliateProgram>,
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    private readonly rulesService: AffiliateRulesService,
    private readonly walletService: WalletService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly budgetTrackingService: BudgetTrackingService,
    private readonly affiliateTreeService: AffiliateTreeService
  ) {}

  async handleOrderPaid(orderId: number) {
    try {
      console.log(` Starting commission calculation for order ${orderId}`);

      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: [
          'user',
          'group_order',
          'group_order.members',
          'group_order.members.user',
        ],
      });

      if (!order) {
        console.warn(
          ` Order ${orderId} not found for commission calculation`
        );
        return;
      }

      const existingCommission = await this.commRepo.findOne({
        where: { related_order_id: orderId },
      });

      if (existingCommission) {
        console.log(
          ` Commission already processed for order ${orderId}, skipping to prevent duplicates`
        );
        return;
      }

      if ((order as any).group_order) {
        console.log(
          `🛒 Detected group buying order ${orderId}, routing to group buying commission logic`
        );
        return this.handleGroupBuyingOrderPaid(orderId);
      }

      return this.processRegularOrder(order);
    } catch (error) {
      console.error(
        `Critical error in commission calculation for order ${orderId}:`,
        error
      );
      throw error;
    }
  }

  private async allocateLevel(
    order: Order,
    item: OrderItem,
    beneficiaryUserId: number,
    level: number,
    programId: number | null,
    linkId: number | null,
    baseAmount: number,
    groupOrderId?: number
  ) {
    const orderId = order.id;
    const now = new Date();

    console.log(
      ` Looking for active rule - Program: ${programId}, Level: ${level}`
    );
    const rule = await this.rulesService.getActiveRule(programId, level, now);

    if (!rule) {
      console.warn(
        ` No active commission rule found for program ${programId}, level ${level}`
      );
      return;
    }

    const rate = Number((rule as any).rate_percent);
    if (isNaN(rate) || rate <= 0) {
      console.warn(` Invalid commission rate: ${rate}`);
      return;
    }

    let computed = Math.max(0, baseAmount * (rate / 100));

    if ((rule as any).cap_per_order != null) {
      const cap = Number((rule as any).cap_per_order);
      if (!Number.isNaN(cap) && cap >= 0) {
        computed = Math.min(computed, cap);
        console.log(`🧢 Applied order cap: ${cap}, final amount: ${computed}`);
      }
    }

    computed = Math.round(computed * 100) / 100;

    if (computed <= 0) {
      console.log(` Skipping commission allocation - computed amount is zero`);
      return;
    }

    console.log(
      ` Calculated commission: ${computed} VND (${rate}% of ${baseAmount})`
    );

    if (programId) {
      try {
        await this.budgetTrackingService.reserveBudget(programId, computed);
        console.log(` Reserved ${computed} from program ${programId} budget`);
      } catch (error) {
        console.error(
          ` Failed to reserve budget for program ${programId}:`,
          error
        );
        return;
      }
    }

    return await this.commRepo.manager.transaction(async (manager) => {
      const rec = manager.create(this.commRepo.target, {
        uuid: crypto.randomUUID(),
        order_item_id: item.id,
        payer_user_id: Number(order.user?.id || (order as any).user_id),
        beneficiary_user_id: beneficiaryUserId,
        program_id: programId,
        level,
        base_amount: baseAmount,
        rate_percent: rate,
        computed_amount: computed,
        amount: computed,
        status: 'PENDING',
        created_at: new Date(),
        link_id: linkId,
        related_order_id: groupOrderId || orderId,
      } as any);

      const savedCommission = await manager.save(rec);
      const commissionId = (savedCommission as any).id;

      console.log(
        ` Commission record created with ID: ${commissionId}, Amount: ${computed}, Beneficiary: ${beneficiaryUserId}`
      );

      const maxRetries = 3;
      let walletSuccess = false;

      // Add commission to wallet for all levels
      // Each user gets their commission added to their own wallet ONCE
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            ` Attempt ${attempt}/${maxRetries}: Adding ${computed} VND commission to wallet for user ${beneficiaryUserId} (Level ${level})`
          );

          const walletResult = await this.walletService.addCommissionToWallet(
            beneficiaryUserId,
            computed,
            commissionId?.toString() || 'unknown',
            `Commission from order #${orderId} - Level ${level}`
          );

          console.log(
            ` Wallet operation successful - New balance: ${walletResult.wallet.balance}`
          );

          await manager.update(this.commRepo.target, commissionId, {
            status: 'PAID',
            paid_at: new Date(),
          });

          console.log(` Commission ${commissionId} status updated to PAID`);

          if (programId) {
            try {
              await this.budgetTrackingService.commitBudget(
                programId,
                computed
              );
              console.log(
                ` Committed ${computed} to spent budget for program ${programId}`
              );
            } catch (error) {
              console.error(
                ` Failed to commit budget for program ${programId}:`,
                error
              );
            }
          }

          console.log(
            ` Commission ${computed} VND successfully added to user ${beneficiaryUserId} wallet`
          );

          walletSuccess = true;
          break;
        } catch (error) {
          console.error(
            ` Wallet operation attempt ${attempt} failed for user ${beneficiaryUserId}:`,
            error
          );
          console.error(`   Error details:`, (error as any).message || error);

          if (attempt === maxRetries) {
            console.error(
              ` All wallet operation attempts failed for commission ${commissionId}`
            );
            await manager.update(this.commRepo.target, commissionId, {
              status: 'PENDING',
            });
          } else {
            console.log(` Waiting ${1000 * attempt}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      if (!walletSuccess) {
        console.warn(
          ` Commission ${commissionId} created but wallet operation failed - status set to PENDING`
        );
      }

      return savedCommission;
    });
  }

  async handleGroupBuyingOrderPaid(orderId: number) {
    try {
      console.log(
        `Starting GROUP BUYING commission calculation for order ${orderId}`
      );

      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        relations: [
          'user',
          'group_order',
          'group_order.members',
          'group_order.members.user',
        ],
      });

      if (!order) {
        console.warn(
          ` Order ${orderId} not found for group buying commission calculation`
        );
        return;
      }

      if (!(order as any).group_order) {
        console.log(
          `Order ${orderId} is not a group buying order, falling back to regular commission calculation`
        );
        const regularOrder = await this.orderRepo.findOne({
          where: { id: orderId },
          relations: ['user'],
        });
        return this.processRegularOrder(regularOrder);
      }

      const groupOrder = (order as any).group_order;
      const orderUser = order.user;

      console.log(
        ` Processing group buying order ${orderId} for group ${groupOrder.id}, user ${orderUser.id}`
      );

      const commissionSource = await this.resolveGroupCommissionSource(
        groupOrder,
        orderUser
      );

      if (!commissionSource) {
        console.log(
          `No commission source found for group buying order ${orderId}`
        );
        return;
      }

      console.log(` Selected commission source for order ${orderId}:`, {
        type: commissionSource.type,
        affiliateUserId: commissionSource.affiliateUserId,
        affiliateCode: commissionSource.affiliateCode,
        programId: commissionSource.programId,
      });

      await this.orderRepo.update(orderId, {
        affiliate_code: commissionSource.affiliateCode,
        affiliate_user_id: commissionSource.affiliateUserId,
        affiliate_program_id: commissionSource.programId,
        affiliate_link_id: commissionSource.linkId,
      } as any);

      console.log(
        ` Updated order ${orderId} with affiliate tracking from ${commissionSource.type}`
      );

      return this.processGroupOrderCommission(order, commissionSource);
    } catch (error) {
      console.error(
        ` Critical error in group buying commission calculation for order ${orderId}:`,
        error
      );
      throw error;
    }
  }

  private async resolveGroupCommissionSource(groupOrder: any, orderUser: any) {
    const commissionSources = [];

    const groupMembers = groupOrder.members || [];
    const memberWithAffiliate = groupMembers.find(
      (member: any) =>
        member.user.id === orderUser.id && member.referrer_affiliate_user_id
    );

    if (memberWithAffiliate) {
      commissionSources.push({
        type: 'member_specific',
        priority: 1,
        affiliateUserId: memberWithAffiliate.referrer_affiliate_user_id,
        affiliateCode: memberWithAffiliate.referrer_affiliate_code,
        programId: memberWithAffiliate.referrer_affiliate_program_id,
        linkId: memberWithAffiliate.referrer_affiliate_link_id,
        source: 'Group member affiliate tracking',
      });
    }

    if (groupOrder.group_affiliate_user_id) {
      commissionSources.push({
        type: 'group_level',
        priority: 2,
        affiliateUserId: groupOrder.group_affiliate_user_id,
        affiliateCode: groupOrder.group_affiliate_code,
        programId: groupOrder.group_affiliate_program_id,
        linkId: null,
        source: 'Group-level affiliate (host inheritance)',
      });
    }

    if (commissionSources.length === 0) {
      console.log(
        `No affiliate tracking found for group ${groupOrder.id}, user ${orderUser.id}`
      );
      return null;
    }

    commissionSources.sort((a, b) => a.priority - b.priority);

    const selectedSource = commissionSources[0];
    console.log(` Commission source resolution for user ${orderUser.id}:`, {
      availableSources: commissionSources.length,
      selected: selectedSource.type,
      reason: selectedSource.source,
    });

    return selectedSource;
  }

  private async processGroupOrderCommission(order: any, commissionSource: any) {
    const orderId = order.id;
    const level0UserId = commissionSource.affiliateUserId;
    const programId = commissionSource.programId;
    const linkId = commissionSource.linkId;
    const groupOrder = (order as any).group_order;

    const existingGroupCommission = await this.commRepo.findOne({
      where: {
        related_order_id: groupOrder.id,
      },
    });

    if (existingGroupCommission) {
      console.log(
        ` Commission already processed for group ${groupOrder.id}, skipping to prevent duplicates`
      );
      return;
    }

    const orderUserId = Number(order.user?.id || (order as any).user_id);
    if (orderUserId === level0UserId) {
      console.log(
        ` Preventing self-commission for user ${level0UserId} on group buying order ${orderId}`
      );
      return;
    }

    if (programId) {
      const program = await this.programRepo.findOne({
        where: { id: programId },
      });
      if (!program || program.status !== 'active') {
        console.warn(
          ` Affiliate program ${programId} is not active, skipping commission`
        );
        return;
      }
      console.log(` Using active affiliate program: ${program.name}`);
    }

    console.log(
      ` Running fraud detection checks for group buying order ${orderId}`
    );
    const fraudCheck = await this.fraudDetectionService.runFraudChecks({
      user_id: orderUserId,
      affiliate_user_id: level0UserId,
      ip_address: (order as any).ip_address,
    });

    if (fraudCheck.fraudDetected) {
      console.warn(
        ` Fraud detected for group buying order ${orderId}:`,
        fraudCheck.checks
      );

      console.log(
        ` Proceeding with commission calculation despite fraud flags - fraud logged for admin review`
      );
    } else {
      console.log(` Fraud checks passed for group buying order ${orderId}`);
    }

    let maxLevels = 1;
    try {
      const ruleLevel1 = await this.rulesService.getActiveRule(
        programId,
        1,
        new Date()
      );
      if (ruleLevel1 && (ruleLevel1 as any).rule?.num_levels) {
        maxLevels = Number((ruleLevel1 as any).rule.num_levels) || 1;
      }
    } catch (err) {
      console.warn(' Unable to fetch num_levels from rule, defaulting to 1');
    }

    console.log(
      ` Processing group buying order ${orderId} with max ${maxLevels} commission levels`
    );
    console.log(
      ` 🔍 DEBUG GROUP: level0UserId=${level0UserId}, orderUserId=${orderUserId}, maxLevels=${maxLevels}`
    );

    const groupMembers = groupOrder.members || [];
    const memberCount = groupMembers.length;
    console.log(
      ` Group ${groupOrder.id} has ${memberCount} members for commission calculation`
    );

    if (memberCount === 0) {
      console.warn(
        ` No members in group ${groupOrder.id}, skipping commission`
      );
      return;
    }

    console.log(
      ` Processing affiliate tree enrollment for orphan members in group ${groupOrder.id}`
    );
    await this.enrollOrphanMembersToAffiliateTree(groupOrder, level0UserId);

    const items = await this.orderItemRepo.find({
      where: { order: { id: order.id } },
      relations: ['product'],
    });

    if (!items || items.length === 0) {
      console.warn(` No order items found for group buying order ${orderId}`);
      return;
    }

    console.log(
      ` Processing ${items.length} items for group buying commission calculation`
    );

    const totalOrderSubtotal = items.reduce((sum, item) => {
      return sum + Number((item as any).subtotal ?? 0);
    }, 0);

    if (totalOrderSubtotal <= 0) {
      console.log(
        `Skipping group buying order with zero/negative total: ${totalOrderSubtotal}`
      );
      return;
    }

    console.log(
      ` Processing group buying order ${orderId}: total subtotal = ${totalOrderSubtotal}`
    );

    try {
      await this.allocateLevel(
        order,
        items[0],
        level0UserId,
        1,
        programId,
        linkId,
        totalOrderSubtotal,
        groupOrder.id
      );

      if (maxLevels > 1) {
        console.log(
          ` Processing multi-level commissions for group buying order ${orderId}, maxLevels=${maxLevels}, levels 2-${maxLevels}`
        );

        const ancestors = await this.affiliateTreeService.findAncestors(
          level0UserId,
          maxLevels - 1
        );
        console.log(
          ` Found ${ancestors.length} ancestors for multi-level commission (requested: ${maxLevels - 1})`
        );
        console.log(
          ` 🔍 DEBUG ANCESTORS: ${ancestors.join(', ')}`
        );
        console.log(
          ` ⚠️ DEBUG: Will call allocateLevel() ${1 + Math.min(ancestors.length, maxLevels - 1)} times total (1 for Level 1 + ${Math.min(ancestors.length, maxLevels - 1)} for ancestors)`
        );

        for (
          let idx = 0;
          idx < ancestors.length && idx < maxLevels - 1;
          idx++
        ) {
          const beneficiaryId = ancestors[idx];
          const level = idx + 2;

          // Skip if ancestor is the same as level0UserId (prevent self-commission at higher levels)
          if (beneficiaryId === level0UserId) {
            console.log(
              ` ⚠️ Skipping Level ${level} - beneficiary ${beneficiaryId} is same as level0UserId (prevent duplicate)`
            );
            continue;
          }

          try {
            await this.allocateLevel(
              order,
              items[0],
              beneficiaryId,
              level,
              programId,
              linkId,
              totalOrderSubtotal,
              groupOrder.id
            );
          } catch (err) {
            console.error(
              ` Failed to allocate group buying commission - level ${level}:`,
              err
            );
          }
        }
      }
    } catch (error) {
      console.error(` Failed to process group buying commission:`, error);
    }

    console.log(
      ` Group buying commission calculation completed for order ${orderId}`
    );
  }

  private async enrollOrphanMembersToAffiliateTree(
    groupOrder: any,
    affiliateUserId: number
  ) {
    try {
      const groupMembers = groupOrder.members || [];
      let enrolledCount = 0;
      let skippedCount = 0;

      console.log(
        `\n🌳 [ENROLL FLOW] Group ${groupOrder.id} - Affiliate ${affiliateUserId}`
      );
      console.log(
        ` Checking ${groupMembers.length} members for orphan status`
      );

      for (const member of groupMembers) {
        const memberId = member.user.id;
        console.log(`\n  👤 Member ${memberId}:`);

        // CHECK 1: Self-referral prevention
        if (memberId === affiliateUserId) {
          console.log(`    ⛔ Self-referral`);
          skippedCount++;
          continue;
        }

        // ========================================
        // CHECK 2: Already has a referrer
        // ========================================
        const existingReferral = await this.referralRepo
          .createQueryBuilder('r')
          .leftJoinAndSelect('r.referrer', 'referrer')
          .where('r.referee_id = :memberId', { memberId })
          .getOne();

        if (existingReferral) {
          console.log(
            `    ✅ Has referrer: ${existingReferral.referrer?.id}`
          );
          skippedCount++;
          continue;
        }
        console.log(
          `    ℹ️  Orphan - can enroll`
        );

        // ========================================
        // CHECK 3: Circular reference prevention
        // ========================================
        const wouldCreateCircle = await this.referralRepo
          .createQueryBuilder('r')
          .where('r.referrer_id = :memberId', { memberId })
          .andWhere('r.referee_id = :affiliateUserId', { affiliateUserId })
          .getOne();

        if (wouldCreateCircle) {
          console.log(
            ` ⛔ [CHECK 3] Would create circular reference`
          );
          skippedCount++;
          continue;
        }
        console.log(
          `    ✅ [CHECK 3] No circular reference`
        );

        // ========================================
        // CHECK 4: Hierarchy violation prevention
        // ========================================
        const isAncestorOfAffiliate = await this.referralRepo
          .createQueryBuilder('r')
          .where('r.referee_id = :affiliateUserId', { affiliateUserId })
          .getOne();

        if (isAncestorOfAffiliate) {
          const ancestors = await this.affiliateTreeService.findAncestors(
            affiliateUserId,
            100
          );
          
          if (ancestors.includes(memberId)) {
            console.log(
              `    ⛔ [CHECK 4] Is ancestor of affiliate`
            );
            skippedCount++;
            continue;
          }
        }
        console.log(
          `    ✅ [CHECK 4] No hierarchy violation`
        );

        // ========================================
        // CHECK 5: Validate users exist
        // ========================================
        const affiliateUser = await this.userRepo.findOne({
          where: { id: affiliateUserId },
        });
        const memberUser = await this.userRepo.findOne({
          where: { id: memberId },
        });

        if (!affiliateUser || !memberUser) {
          console.error(
            `    ⛔ [CHECK 5] User not found`
          );
          skippedCount++;
          continue;
        }
        console.log(
          `    ✅ [CHECK 5] Users exist`
        );

        // All checks passed - Enroll member
        try {
          console.log(
            `    📝 Creating referral with code: "${affiliateUser.code}" (from affiliate user ${affiliateUserId})`
          );
          
          const newReferral = this.referralRepo.create({
            referrer: affiliateUser,
            referee: memberUser,
            code: affiliateUser.code, // Use affiliate user's code
            status: 'active',
            created_at: new Date(),
          });

          console.log(
            `    📋 Referral object before save:`,
            JSON.stringify({
              referrer_id: affiliateUser.id,
              referee_id: memberUser.id,
              code: newReferral.code,
              status: newReferral.status,
              created_at: newReferral.created_at,
            }, null, 2)
          );

          const savedReferral = await this.referralRepo.save(newReferral);
          
          console.log(
            `    ✅ [ENROLLED] → Affiliate ${affiliateUserId} with code "${savedReferral.code}"`
          );
          console.log(
            `    ✅ Referral ID: ${savedReferral.id}, Code: "${savedReferral.code}", Status: ${savedReferral.status}`
          );
          enrolledCount++;
        } catch (err) {
          console.error(`    ⛔ [ERROR] Enroll failed:`, (err as any).message);
          console.error(`    ⛔ Error details:`, err);
          skippedCount++;
        }

      }

      // Summary
      console.log(
        `\n📊 Group ${groupOrder.id} enrollment summary:`
      );
      console.log(`   Total: ${groupMembers.length} | Enrolled: ${enrolledCount} | Skipped: ${skippedCount}`);
    } catch (error) {
      console.error(` Error during affiliate tree enrollment:`, error);
    }
  }

  private async processRegularOrder(order: any) {
    if (!order) return;

    const orderId = order.id;
    console.log(` Processing regular order commission for order ${orderId}`);

    console.log(` DEBUG - Order ${orderId} affiliate fields:`, {
      affiliate_code: (order as any).affiliate_code,
      affiliate_user_id: (order as any).affiliate_user_id,
      affiliate_program_id: (order as any).affiliate_program_id,
      affiliate_link_id: (order as any).affiliate_link_id,
    });

    let level0UserId: number | null = null;
    let programId: number | null = null;
    let linkId: number | null = null;

    if ((order as any).affiliate_user_id) {
      level0UserId = Number((order as any).affiliate_user_id);
      programId = (order as any).affiliate_program_id
        ? Number((order as any).affiliate_program_id)
        : null;
      linkId = (order as any).affiliate_link_id
        ? Number((order as any).affiliate_link_id)
        : null;
      console.log(
        ` Using affiliate user: ${level0UserId}, program: ${programId}, link: ${linkId}`
      );
    }

    if (programId) {
      const program = await this.programRepo.findOne({
        where: { id: programId },
      });
      if (!program) {
        console.warn(` Affiliate program ${programId} not found`);
        return;
      }
      if (program.status !== 'active') {
        console.warn(
          ` Affiliate program ${programId} is not active (status: ${program.status})`
        );
        return;
      }
      console.log(` Using active affiliate program: ${program.name}`);
    }

    if (!level0UserId) {
      console.log(` No affiliate tracking found for order ${orderId}`);
      return;
    }

    const orderUserId = Number(order.user?.id || (order as any).user_id);
    if (orderUserId === level0UserId) {
      console.log(
        ` Preventing self-commission for user ${level0UserId} on order ${orderId}`
      );
      return;
    }

    console.log(`Running fraud detection checks for order ${orderId}`);
    const fraudCheck = await this.fraudDetectionService.runFraudChecks({
      user_id: orderUserId,
      affiliate_user_id: level0UserId,
      ip_address: (order as any).ip_address,
    });

    if (fraudCheck.fraudDetected) {
      console.warn(` Fraud detected for order ${orderId}:`, fraudCheck.checks);
      console.log(
        ` Proceeding with commission calculation despite fraud flags - fraud logged for admin review`
      );
    } else {
      console.log(` Fraud checks passed for order ${orderId}`);
    }

    let maxLevels = 1;
    try {
      const ruleLevel1 = await this.rulesService.getActiveRule(
        programId,
        1,
        new Date()
      );
      if (ruleLevel1 && (ruleLevel1 as any).rule?.num_levels) {
        maxLevels = Number((ruleLevel1 as any).rule.num_levels) || 1;
      }
    } catch (err) {
      console.warn(' Unable to fetch num_levels from rule, defaulting to 1');
    }

    console.log(
      ` 🔍 DEBUG REGULAR: maxLevels=${maxLevels}`
    );

    const items = await this.orderItemRepo.find({
      where: { order: { id: order.id } },
      relations: ['product'],
    });

    if (!items || items.length === 0) {
      console.warn(` No order items found for order ${orderId}`);
      return;
    }

    console.log(
      ` Processing ${items.length} items for commission calculation`
    );

    for (const item of items) {
      const baseAmount = Number((item as any).subtotal ?? 0);
      if (baseAmount <= 0) {
        console.log(
          ` Skipping item ${item.id} with zero/negative amount: ${baseAmount}`
        );
        continue;
      }

      console.log(
        `💰 Processing item ${item.id} with base amount: ${baseAmount}`
      );

      try {
        await this.allocateLevel(
          order,
          item,
          level0UserId,
          1,
          programId,
          linkId,
          baseAmount
        );
      } catch (error) {
        console.error(
          ` Failed to allocate commission for item ${item.id} - level 1:`,
          error
        );
      }

      if (maxLevels > 1) {
        try {
          const ancestors = await this.affiliateTreeService.findAncestors(
            level0UserId,
            maxLevels - 1
          );
          console.log(
            ` Found ${ancestors.length} ancestors for item ${item.id} (requested: ${maxLevels - 1})`
          );
          console.log(
            ` ⚠️ DEBUG: Will call allocateLevel() ${1 + Math.min(ancestors.length, maxLevels - 1)} times for this item (1 for Level 1 + ${Math.min(ancestors.length, maxLevels - 1)} for ancestors)`
          );
          for (
            let idx = 0;
            idx < ancestors.length && idx < maxLevels - 1;
            idx++
          ) {
            const beneficiaryId = ancestors[idx];
            const level = idx + 2;
            
            // Skip if ancestor is the same as level0UserId (prevent self-commission at higher levels)
            if (beneficiaryId === level0UserId) {
              console.log(
                ` ⚠️ Skipping Level ${level} - beneficiary ${beneficiaryId} is same as level0UserId (prevent duplicate)`
              );
              continue;
            }
            
            try {
              await this.allocateLevel(
                order,
                item,
                beneficiaryId,
                level,
                programId,
                linkId,
                baseAmount
              );
            } catch (err) {
              console.error(
                ` Failed to allocate commission for item ${item.id} - level ${level}:`,
                err
              );
            }
          }
        } catch (ancErr) {
          console.error(' Error while fetching ancestors:', ancErr);
        }
      }
    }

    console.log(` Commission calculation completed for order ${orderId}`);
  }

  async processGroupBuyingCommissions(groupId: number) {
    try {
      console.log(`🎯 Processing MULTI-LAYER commissions for group ${groupId}`);

      const group = await this.orderRepo.manager.findOne('GroupOrder', {
        where: { id: groupId },
        relations: ['orders', 'orders.user', 'members', 'members.user'],
      } as any);

      if (!group) {
        console.warn(`⚠️ Group ${groupId} not found`);
        return;
      }

      const orders = (group as any).orders;
      if (!orders.length) {
        console.warn(`⚠️ No orders found for group ${groupId}`);
        return;
      }

      console.log(
        ` Processing ${orders.length} orders with multi-layer commission system`
      );

      const commissionSources = await this.collectCommissionSources(
        group as any
      );
      console.log(
        ` Found ${commissionSources.length} commission sources:`,
        commissionSources
      );

      const results = [];
      for (const order of orders) {
        try {
          const orderCommissions = await this.processOrderWithMultiLayer(
            order,
            commissionSources
          );
          results.push({
            orderId: order.id,
            status: 'success',
            commissions: orderCommissions,
          });
        } catch (error) {
          console.error(` Failed to process order ${order.id}:`, error);
          results.push({
            orderId: order.id,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      console.log(
        ` Completed multi-layer commission processing for group ${groupId}`
      );
      return results;
    } catch (error) {
      console.error(
        ` Critical error in multi-layer commission processing for group ${groupId}:`,
        error
      );
      throw error;
    }
  }

  private async collectCommissionSources(group: any) {
    const sources = [];

    if (group.group_affiliate_user_id) {
      sources.push({
        type: 'group_level',
        affiliateUserId: group.group_affiliate_user_id,
        affiliateCode: group.group_affiliate_code,
        programId: group.group_affiliate_program_id,
        priority: 2,
        appliesTo: 'all_orders',
      });
    }

    for (const member of group.members) {
      if (member.referrer_affiliate_user_id) {
        sources.push({
          type: 'member_specific',
          affiliateUserId: member.referrer_affiliate_user_id,
          affiliateCode: member.referrer_affiliate_code,
          programId: member.referrer_affiliate_program_id,
          priority: 1,
          appliesTo: member.user.id,
          memberId: member.id,
        });
      }
    }

    return sources;
  }

  private async processOrderWithMultiLayer(
    order: any,
    commissionSources: any[]
  ) {
    console.log(
      `Processing order ${order.id} for user ${order.user.id} with multi-layer logic`
    );

    const applicableSources = commissionSources.filter(
      (source) =>
        source.appliesTo === 'all_orders' || source.appliesTo === order.user.id
    );

    if (!applicableSources.length) {
      console.log(` No commission sources for order ${order.id}`);
      return [];
    }

    const selectedSource = this.resolveCommissionConflict(
      applicableSources,
      order
    );

    if (!selectedSource) {
      console.log(
        ` No commission source selected for order ${order.id} after conflict resolution`
      );
      return [];
    }

    console.log(` Selected commission source for order ${order.id}:`, {
      type: selectedSource.type,
      affiliateUserId: selectedSource.affiliateUserId,
      priority: selectedSource.priority,
    });

    await this.orderRepo.update(order.id, {
      affiliate_code: selectedSource.affiliateCode,
      affiliate_user_id: selectedSource.affiliateUserId,
      affiliate_program_id: selectedSource.programId,
    } as any);

    await this.handleOrderPaid(order.id);

    return [
      {
        orderId: order.id,
        source: selectedSource,
        processed: true,
      },
    ];
  }

  private resolveCommissionConflict(sources: any[], order: any) {
    if (sources.length === 1) {
      return sources[0];
    }

    console.log(
      ` Resolving commission conflict for order ${order.id} with ${sources.length} sources`
    );

    const memberSpecific = sources.find((s) => s.type === 'member_specific');
    if (memberSpecific) {
      console.log(`✅ Member-specific affiliate wins for order ${order.id}`);
      return memberSpecific;
    }

    const sortedByPriority = sources.sort((a, b) => a.priority - b.priority);
    const winner = sortedByPriority[0];

    console.log(`Priority-based winner for order ${order.id}:`, winner.type);
    return winner;
  }
}
