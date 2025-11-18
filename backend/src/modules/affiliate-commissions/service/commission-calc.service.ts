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
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { User } from '../../user/user.entity';
import { AffiliateProgram } from '../../affiliate-program/affiliate-program.entity';
import { AffiliateTreeService } from '../../affiliate-tree/affiliate-tree.service';

@Injectable()
export class CommissionCalcService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(AffiliateCommission) private readonly commRepo: Repository<AffiliateCommission>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AffiliateProgram) private readonly programRepo: Repository<AffiliateProgram>,
    @InjectRepository(Referral) private readonly referralRepo: Repository<Referral>,
    private readonly rulesService: AffiliateRulesService,
    private readonly walletService: WalletService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly budgetTrackingService: BudgetTrackingService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly affiliateTreeService: AffiliateTreeService,
  ) {}

  // Hàm gọi khi đơn hàng chuyển sang PAID
  async handleOrderPaid(orderId: number) {
    try {
      console.log(`🎯 Starting commission calculation for order ${orderId}`);
      
      const order = await this.orderRepo.findOne({ 
        where: { id: orderId },
        relations: ['user', 'group_order', 'group_order.members', 'group_order.members.user'] // Load group relations
      });
      
      if (!order) {
        console.warn(`⚠️ Order ${orderId} not found for commission calculation`);
        return;
      }

      // 🛒 Check if this is a group buying order and route accordingly
      if ((order as any).group_order) {
        console.log(`🛒 Detected group buying order ${orderId}, routing to group buying commission logic`);
        return this.handleGroupBuyingOrderPaid(orderId);
      }

      // For regular (non-group) orders, use the extracted method
      return this.processRegularOrder(order);
    } catch (error) {
      console.error(`❌ Critical error in commission calculation for order ${orderId}:`, error);
      throw error; // Re-throw to ensure calling code is aware of the failure
    }
  }

  private async allocateLevel(
    order: Order,
    item: OrderItem,
    beneficiaryUserId: number,
    level: number,
    programId: number | null,
    linkId: number| null,
    baseAmount: number,
  ) {
    const orderId = order.id;
    const now = new Date();
    
    console.log(`🔍 Looking for active rule - Program: ${programId}, Level: ${level}`);
    const rule = await this.rulesService.getActiveRule(programId, level, now);
    
    if (!rule) {
      console.warn(`⚠️ No active commission rule found for program ${programId}, level ${level}`);
      return;
    }

    const rate = Number((rule as any).rate_percent);
    if (isNaN(rate) || rate <= 0) {
      console.warn(`⚠️ Invalid commission rate: ${rate}`);
      return;
    }

    let computed = Math.max(0, baseAmount * (rate / 100));
    
    // Apply cap_per_order if exists
    if ((rule as any).cap_per_order != null) {
      const cap = Number((rule as any).cap_per_order);
      if (!Number.isNaN(cap) && cap >= 0) {
        computed = Math.min(computed, cap);
        console.log(`🧢 Applied order cap: ${cap}, final amount: ${computed}`);
      }
    }
    
    computed = Math.round(computed * 100) / 100;

    if (computed <= 0) {
      console.log(`⏭️ Skipping commission allocation - computed amount is zero`);
      return;
    }

    console.log(`💵 Calculated commission: ${computed} VND (${rate}% of ${baseAmount})`);

    // 💰 Reserve budget before creating commission
    if (programId) {
      try {
        await this.budgetTrackingService.reserveBudget(programId, computed);
        console.log(`💰 Reserved ${computed} from program ${programId} budget`);
      } catch (error) {
        console.error(`❌ Failed to reserve budget for program ${programId}:`, error);
        return; // Skip commission creation if budget reservation fails
      }
    }

    // Use database transaction to ensure consistency
    return await this.commRepo.manager.transaction(async (manager) => {
      const rec = manager.create(this.commRepo.target, {
        uuid: crypto.randomUUID(), // ✅ Generate UUID
        order_item_id: item.id,
        payer_user_id: Number(order.user?.id || (order as any).user_id),
        beneficiary_user_id: beneficiaryUserId,
        program_id: programId,
        level,
        base_amount: baseAmount,
        rate_percent: rate,
        computed_amount: computed,
        amount: computed,
        status: 'PENDING', // Start as PENDING, will be updated to PAID after successful wallet operation
        created_at: new Date(),
        link_id: linkId,
        related_order_id: orderId
      } as any);

      const savedCommission = await manager.save(rec);
      const commissionId = (savedCommission as any).id;

      console.log(`💾 Commission record created with ID: ${commissionId}`);

      // ✅ AUTO-CONVERT COMMISSION TO COINS AND ADD TO WALLET with retry mechanism
      const maxRetries = 3;
      let walletSuccess = false;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`💰 Attempt ${attempt}/${maxRetries}: Adding commission to wallet`);
          
          await this.walletService.addCommissionToWallet(
            beneficiaryUserId,
            computed,
            commissionId?.toString() || 'unknown',
            `Commission from order #${orderId} - Level ${level}`
          );
          
          // Update commission status to PAID after successful wallet operation
          await manager.update(this.commRepo.target, commissionId, { 
            status: 'PAID',
            paid_at: new Date()
          });
          
          // 💰 Commit budget (move from pending to spent)
          if (programId) {
            try {
              await this.budgetTrackingService.commitBudget(programId, computed);
              console.log(`💰 Committed ${computed} to spent budget for program ${programId}`);
            } catch (error) {
              console.error(`❌ Failed to commit budget for program ${programId}:`, error);
              // Continue anyway as commission is already paid
            }
          }
          
          console.log(`✅ Commission ${computed} VND successfully added to user ${beneficiaryUserId} wallet`);
          
          // 🔔 Send real-time notification to affiliate user
          try {
            // Get program info for notification
            const program = programId ? await this.programRepo.findOne({ where: { id: programId } }) : null;
            
            // Get order item details for notification
            const orderItem = await this.orderItemRepo.findOne({
              where: { id: item.id },
              relations: ['product']
            });
            
            await this.notificationsGateway.notifyCommissionPaid(beneficiaryUserId, {
              commissionId: savedCommission.uuid,
              amount: computed,
              newBalance: 0, // Will be updated by frontend after receiving notification
            });
            
            // Also send commission earned notification with details
            await this.notificationsGateway.notifyCommissionEarned(beneficiaryUserId, {
              commissionId: savedCommission.uuid,
              amount: computed,
              level,
              orderId,
              orderNumber: `#${orderId}`,
              productName: orderItem?.product?.name || 'Unknown Product',
              programName: program?.name || 'Unknown Program',
            });
            
            console.log(`🔔 Notification sent to user ${beneficiaryUserId}`);
          } catch (notifError) {
            console.error(`⚠️ Failed to send notification:`, notifError);
            // Don't fail the commission if notification fails
          }
          
          walletSuccess = true;
          break;
          
        } catch (error) {
          console.error(`❌ Wallet operation attempt ${attempt} failed:`, error);
          
          if (attempt === maxRetries) {
            // Final attempt failed - keep commission as PENDING
            console.error(`🚨 All wallet operation attempts failed for commission ${commissionId}`);
            await manager.update(this.commRepo.target, commissionId, { 
              status: 'PENDING'
            });
            
            // TODO: Add notification system for manual review
            // await this.notificationService.createFailedCommissionAlert(commissionId, error);
          } else {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      if (!walletSuccess) {
        console.warn(`⚠️ Commission ${commissionId} created but wallet operation failed - status set to PENDING`);
      }
      
      return savedCommission;
    });
  }

  /**
   * Handle commission calculation for group buying orders
   * Enhanced version with multi-level commission support and conflict resolution
   */
  async handleGroupBuyingOrderPaid(orderId: number) {
    try {
      console.log(`🎯 Starting GROUP BUYING commission calculation for order ${orderId}`);
      
      const order = await this.orderRepo.findOne({ 
        where: { id: orderId },
        relations: ['user', 'group_order', 'group_order.members', 'group_order.members.user'] 
      });
      
      if (!order) {
        console.warn(`⚠️ Order ${orderId} not found for group buying commission calculation`);
        return;
      }

      // Verify this is a group buying order
      if (!(order as any).group_order) {
        console.log(`ℹ️ Order ${orderId} is not a group buying order, falling back to regular commission calculation`);
        // Remove the group_order relation to prevent infinite recursion
        const regularOrder = await this.orderRepo.findOne({ 
          where: { id: orderId },
          relations: ['user']
        });
        return this.processRegularOrder(regularOrder);
      }

      const groupOrder = (order as any).group_order;
      const orderUser = order.user;
      
      console.log(`🛒 Processing group buying order ${orderId} for group ${groupOrder.id}, user ${orderUser.id}`);

      // 🎯 Step 1: Determine commission source with priority-based resolution
      const commissionSource = await this.resolveGroupCommissionSource(groupOrder, orderUser);
      
      if (!commissionSource) {
        console.log(`ℹ️ No commission source found for group buying order ${orderId}`);
        return;
      }

      console.log(`✅ Selected commission source for order ${orderId}:`, {
        type: commissionSource.type,
        affiliateUserId: commissionSource.affiliateUserId,
        affiliateCode: commissionSource.affiliateCode,
        programId: commissionSource.programId
      });

      // 🎯 Step 2: Update order with affiliate tracking information
      await this.orderRepo.update(orderId, {
        affiliate_code: commissionSource.affiliateCode,
        affiliate_user_id: commissionSource.affiliateUserId,
        affiliate_program_id: commissionSource.programId,
        affiliate_link_id: commissionSource.linkId
      } as any);

      console.log(`✅ Updated order ${orderId} with affiliate tracking from ${commissionSource.type}`);

      // 🎯 Step 3: Process multi-level commission calculation
      return this.processGroupOrderCommission(order, commissionSource);

    } catch (error) {
      console.error(`❌ Critical error in group buying commission calculation for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve commission source for group buying order with priority-based logic
   */
  private async resolveGroupCommissionSource(groupOrder: any, orderUser: any) {
    const commissionSources = [];

    // 🎯 Priority 1: Member-specific affiliate (highest priority)
    const groupMembers = groupOrder.members || [];
    const memberWithAffiliate = groupMembers.find((member: any) => 
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
        source: 'Group member affiliate tracking'
      });
    }

    // 🎯 Priority 2: Group-level affiliate (host inheritance)
    if (groupOrder.group_affiliate_user_id) {
      commissionSources.push({
        type: 'group_level',
        priority: 2,
        affiliateUserId: groupOrder.group_affiliate_user_id,
        affiliateCode: groupOrder.group_affiliate_code,
        programId: groupOrder.group_affiliate_program_id,
        linkId: null, // Group-level doesn't have specific link
        source: 'Group-level affiliate (host inheritance)'
      });
    }

    if (commissionSources.length === 0) {
      console.log(`ℹ️ No affiliate tracking found for group ${groupOrder.id}, user ${orderUser.id}`);
      return null;
    }

    // Sort by priority (lower number = higher priority)
    commissionSources.sort((a, b) => a.priority - b.priority);
    
    const selectedSource = commissionSources[0];
    console.log(`🔀 Commission source resolution for user ${orderUser.id}:`, {
      availableSources: commissionSources.length,
      selected: selectedSource.type,
      reason: selectedSource.source
    });

    return selectedSource;
  }

  /**
   * Process commission calculation for group order with multi-level support
   * Commission is calculated based on the number of members in the group
   */
  private async processGroupOrderCommission(order: any, commissionSource: any) {
    const orderId = order.id;
    const level0UserId = commissionSource.affiliateUserId;
    const programId = commissionSource.programId;
    const linkId = commissionSource.linkId;
    const groupOrder = (order as any).group_order;

    // Prevent self-commission
    const orderUserId = Number(order.user?.id || (order as any).user_id);
    if (orderUserId === level0UserId) {
      console.log(`🚫 Preventing self-commission for user ${level0UserId} on group buying order ${orderId}`);
      return;
    }

    // Check program status
    if (programId) {
      const program = await this.programRepo.findOne({ where: { id: programId } });
      if (!program || program.status !== 'active') {
        console.warn(`⚠️ Affiliate program ${programId} is not active, skipping commission`);
        return;
      }
      console.log(`✅ Using active affiliate program: ${program.name}`);
    }

    // 🚨 Run fraud detection checks
    console.log(`🔍 Running fraud detection checks for group buying order ${orderId}`);
    const fraudCheck = await this.fraudDetectionService.runFraudChecks({
      user_id: orderUserId,
      affiliate_user_id: level0UserId,
      ip_address: (order as any).ip_address,
    });

    if (fraudCheck.fraudDetected) {
      console.warn(`🚨 Fraud detected for group buying order ${orderId}:`, fraudCheck.checks);
      return;
    }
    console.log(`✅ Fraud checks passed for group buying order ${orderId}`);

    // Determine maximum levels from active rule
    let maxLevels = 1;
    try {
      const ruleLevel1 = await this.rulesService.getActiveRule(programId, 1, new Date());
      if (ruleLevel1 && (ruleLevel1 as any).rule?.num_levels) {
        maxLevels = Number((ruleLevel1 as any).rule.num_levels) || 1;
      }
    } catch (err) {
      console.warn('⚠️ Unable to fetch num_levels from rule, defaulting to 1');
    }

    console.log(`🎯 Processing group buying order ${orderId} with max ${maxLevels} commission levels`);

    // 🎯 NEW: Calculate commission based on group member count
    const groupMembers = groupOrder.members || [];
    const memberCount = groupMembers.length;
    console.log(`👥 Group ${groupOrder.id} has ${memberCount} members for commission calculation`);

    if (memberCount === 0) {
      console.warn(`⚠️ No members in group ${groupOrder.id}, skipping commission`);
      return;
    }

    // 🎯 NEW: Enroll orphan members into affiliate tree
    console.log(`🌳 Processing affiliate tree enrollment for orphan members in group ${groupOrder.id}`);
    await this.enrollOrphanMembersToAffiliateTree(groupOrder, level0UserId);

    // Get order items for commission calculation
    const items = await this.orderItemRepo.find({
      where: { order: { id: order.id } },
      relations: ['product'],
    });

    if (!items || items.length === 0) {
      console.warn(`⚠️ No order items found for group buying order ${orderId}`);
      return;
    }

    console.log(`📦 Processing ${items.length} items for group buying commission calculation`);

    // Process commission for each item
    // Commission base amount = item subtotal * member count (group size multiplier)
    for (const item of items) {
      const baseAmount = Number((item as any).subtotal ?? 0);
      if (baseAmount <= 0) {
        console.log(`⏭️ Skipping item ${item.id} with zero/negative amount: ${baseAmount}`);
        continue;
      }

      // 🎯 NEW: Commission is based on group member count, not individual order amount
      const commissionBaseAmount = baseAmount * memberCount;
      console.log(`💰 Processing group buying item ${item.id}: base ${baseAmount} × ${memberCount} members = ${commissionBaseAmount}`);

      try {
        // Level 1: Direct referrer (affiliate who created the link)
        await this.allocateLevel(order, item, level0UserId, 1, programId, linkId, commissionBaseAmount);

        // Levels 2+: Multi-level commission through affiliate tree
        if (maxLevels > 1) {
          console.log(`🌳 Processing multi-level commissions for group buying order ${orderId}, levels 2-${maxLevels}`);
          
          const ancestors = await this.affiliateTreeService.findAncestors(level0UserId, maxLevels - 1);
          console.log(`👥 Found ${ancestors.length} ancestors for multi-level commission`);
          
          for (let idx = 0; idx < ancestors.length && idx < maxLevels - 1; idx++) {
            const beneficiaryId = ancestors[idx];
            const level = idx + 2; // Level 2 starts from first ancestor
            
            try {
              await this.allocateLevel(order, item, beneficiaryId, level, programId, linkId, commissionBaseAmount);
            } catch (err) {
              console.error(`❌ Failed to allocate group buying commission for item ${item.id} - level ${level}:`, err);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Failed to process group buying commission for item ${item.id}:`, error);
      }
    }
    
    console.log(`✅ Group buying commission calculation completed for order ${orderId}`);
  }

  /**
   * Enroll orphan members (users without referrer) into affiliate tree
   * Only users who are not already part of the affiliate tree are enrolled
   */
  private async enrollOrphanMembersToAffiliateTree(groupOrder: any, affiliateUserId: number) {
    try {
      const groupMembers = groupOrder.members || [];
      
      console.log(`🔍 Checking ${groupMembers.length} members for orphan status in group ${groupOrder.id}`);

      for (const member of groupMembers) {
        const memberId = member.user.id;
        
        // Skip the affiliate user themselves
        if (memberId === affiliateUserId) {
          console.log(`⏭️ Skipping affiliate user ${affiliateUserId} (cannot be their own referrer)`);
          continue;
        }

        // Check if member already has a referrer (is not orphan)
        // Query by referee_id column directly
        const existingReferral = await this.referralRepo.createQueryBuilder('r')
          .where('r.referee_id = :memberId', { memberId })
          .getOne();

        if (existingReferral) {
          console.log(`ℹ️ Member ${memberId} already has a referrer, skipping`);
          continue;
        }

        // Member is orphan - enroll them into affiliate tree under the affiliate user
        try {
          const affiliateUser = await this.userRepo.findOne({ where: { id: affiliateUserId } });
          const memberUser = await this.userRepo.findOne({ where: { id: memberId } });

          if (!affiliateUser || !memberUser) {
            console.error(`❌ Cannot find affiliate user ${affiliateUserId} or member user ${memberId}`);
            continue;
          }

          const newReferral = this.referralRepo.create({
            referrer: affiliateUser,
            referee: memberUser,
            created_at: new Date()
          });
          
          await this.referralRepo.save(newReferral);
          console.log(`✅ Enrolled orphan member ${memberId} under affiliate user ${affiliateUserId}`);
        } catch (err) {
          console.error(`❌ Failed to enroll member ${memberId}:`, err);
        }
      }

      console.log(`✅ Affiliate tree enrollment completed for group ${groupOrder.id}`);
    } catch (error) {
      console.error(`❌ Error during affiliate tree enrollment:`, error);
    }
  }

  /**
   * Process regular (non-group) order commission
   * Extracted to prevent infinite recursion
   */
  private async processRegularOrder(order: any) {
    if (!order) return;
    
    const orderId = order.id;
    console.log(`📋 Processing regular order commission for order ${orderId}`);

    // 🐛 DEBUG: Log all affiliate fields from the order
    console.log(`🔍 DEBUG - Order ${orderId} affiliate fields:`, {
      affiliate_code: (order as any).affiliate_code,
      affiliate_user_id: (order as any).affiliate_user_id,
      affiliate_program_id: (order as any).affiliate_program_id,
      affiliate_link_id: (order as any).affiliate_link_id,
    });

    // Xác định affiliate trực tiếp (level 0 trong chuỗi giới thiệu, nhận hoa hồng level 1)
    let level0UserId: number | null = null;
    let programId: number | null = null;
    let linkId: number | null = null;

    if ((order as any).affiliate_user_id) {
      level0UserId = Number((order as any).affiliate_user_id);
      programId = (order as any).affiliate_program_id ? Number((order as any).affiliate_program_id) : null;
      linkId = (order as any).affiliate_link_id ? Number((order as any).affiliate_link_id) : null;
      console.log(`👤 Using affiliate user: ${level0UserId}, program: ${programId}, link: ${linkId}`);
    }

    // Check if program is active before proceeding
    if (programId) {
      const program = await this.programRepo.findOne({ where: { id: programId } });
      if (!program) {
        console.warn(`⚠️ Affiliate program ${programId} not found`);
        return;
      }
      if (program.status !== 'active') {
        console.warn(`⚠️ Affiliate program ${programId} is not active (status: ${program.status})`);
        return;
      }
      console.log(`✅ Using active affiliate program: ${program.name}`);
    }

    if (!level0UserId) {
      console.log(`ℹ️ No affiliate tracking found for order ${orderId}`);
      return;
    }

    // Improved self-commission check
    const orderUserId = Number(order.user?.id || (order as any).user_id);
    if (orderUserId === level0UserId) {
      console.log(`🚫 Preventing self-commission for user ${level0UserId} on order ${orderId}`);
      return;
    }

    // 🚨 Run fraud detection checks
    console.log(`🔍 Running fraud detection checks for order ${orderId}`);
    const fraudCheck = await this.fraudDetectionService.runFraudChecks({
      user_id: orderUserId,
      affiliate_user_id: level0UserId,
      ip_address: (order as any).ip_address,
    });

    if (fraudCheck.fraudDetected) {
      console.warn(`🚨 Fraud detected for order ${orderId}:`, fraudCheck.checks);
      return;
    }
    console.log(`✅ Fraud checks passed for order ${orderId}`);

    // Determine maximum levels from active rule (default 1)
    let maxLevels = 1;
    try {
      const ruleLevel1 = await this.rulesService.getActiveRule(programId, 1, new Date());
      if (ruleLevel1 && (ruleLevel1 as any).rule?.num_levels) {
        maxLevels = Number((ruleLevel1 as any).rule.num_levels) || 1;
      }
    } catch (err) {
      console.warn('⚠️ Unable to fetch num_levels from rule, defaulting to 1');
    }

    // Get order items for commission calculation
    const items = await this.orderItemRepo.find({
      where: { order: { id: order.id } },
      relations: ['product'],
    });

    if (!items || items.length === 0) {
      console.warn(`⚠️ No order items found for order ${orderId}`);
      return;
    }

    console.log(`📦 Processing ${items.length} items for commission calculation`);

    // Process commission for each item
    for (const item of items) {
      const baseAmount = Number((item as any).subtotal ?? 0);
      if (baseAmount <= 0) {
        console.log(`⏭️ Skipping item ${item.id} with zero/negative amount: ${baseAmount}`);
        continue;
      }

      console.log(`💰 Processing item ${item.id} with base amount: ${baseAmount}`);

      // Allocate commission for Level 1 (người tạo link)
      try {
        await this.allocateLevel(order, item, level0UserId, 1, programId, linkId, baseAmount);
      } catch (error) {
        console.error(`❌ Failed to allocate commission for item ${item.id} - level 1:`, error);
      }

      // === Allocate for higher levels (2..N) ===
      if (maxLevels > 1) {
        try {
          const ancestors = await this.affiliateTreeService.findAncestors(level0UserId, maxLevels - 1);
          for (let idx = 0; idx < ancestors.length && idx < maxLevels - 1; idx++) {
            const beneficiaryId = ancestors[idx];
            const level = idx + 2; // Level 2 bắt đầu từ ancestor đầu tiên
            try {
              await this.allocateLevel(order, item, beneficiaryId, level, programId, linkId, baseAmount);
            } catch (err) {
              console.error(`❌ Failed to allocate commission for item ${item.id} - level ${level}:`, err);
            }
          }
        } catch (ancErr) {
          console.error('❌ Error while fetching ancestors:', ancErr);
        }
      }
    }
    
    console.log(`✅ Commission calculation completed for order ${orderId}`);
  }

  /**
   * Process commission for completed group buying campaigns
   * Enhanced version with multi-layer commission support
   */
  async processGroupBuyingCommissions(groupId: number) {
    try {
      console.log(`🎯 Processing MULTI-LAYER commissions for group ${groupId}`);

      // Get group with all relations
      const group = await this.orderRepo.manager.findOne('GroupOrder', {
        where: { id: groupId },
        relations: ['orders', 'orders.user', 'members', 'members.user']
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

      console.log(`📦 Processing ${orders.length} orders with multi-layer commission system`);

      // 🎯 Step 1: Collect all commission sources
      const commissionSources = await this.collectCommissionSources(group as any);
      console.log(`🔍 Found ${commissionSources.length} commission sources:`, commissionSources);

      // 🎯 Step 2: Process each order with conflict resolution
      const results = [];
      for (const order of orders) {
        try {
          const orderCommissions = await this.processOrderWithMultiLayer(order, commissionSources);
          results.push({ orderId: order.id, status: 'success', commissions: orderCommissions });
        } catch (error) {
          console.error(`❌ Failed to process order ${order.id}:`, error);
          results.push({ orderId: order.id, status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }

      console.log(`✅ Completed multi-layer commission processing for group ${groupId}`);
      return results;

    } catch (error) {
      console.error(`❌ Critical error in multi-layer commission processing for group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Collect all possible commission sources for a group
   */
  private async collectCommissionSources(group: any) {
    const sources = [];

    // 🎯 Source 1: Group-level affiliate (host inheritance)
    if (group.group_affiliate_user_id) {
      sources.push({
        type: 'group_level',
        affiliateUserId: group.group_affiliate_user_id,
        affiliateCode: group.group_affiliate_code,
        programId: group.group_affiliate_program_id,
        priority: 2, // Lower priority than member-specific
        appliesTo: 'all_orders' // Applies to all orders unless overridden
      });
    }

    // 🎯 Source 2: Member-specific affiliates
    for (const member of group.members) {
      if (member.referrer_affiliate_user_id) {
        sources.push({
          type: 'member_specific',
          affiliateUserId: member.referrer_affiliate_user_id,
          affiliateCode: member.referrer_affiliate_code,
          programId: member.referrer_affiliate_program_id,
          priority: 1, // Higher priority
          appliesTo: member.user.id, // Only applies to this specific user's orders
          memberId: member.id
        });
      }
    }

    return sources;
  }

  /**
   * Process single order with multi-layer commission logic
   */
  private async processOrderWithMultiLayer(order: any, commissionSources: any[]) {
    console.log(`🔄 Processing order ${order.id} for user ${order.user.id} with multi-layer logic`);

    // 🎯 Step 1: Find applicable commission sources for this order
    const applicableSources = commissionSources.filter(source => 
      source.appliesTo === 'all_orders' || source.appliesTo === order.user.id
    );

    if (!applicableSources.length) {
      console.log(`ℹ️ No commission sources for order ${order.id}`);
      return [];
    }

    // 🎯 Step 2: Apply priority-based conflict resolution
    const selectedSource = this.resolveCommissionConflict(applicableSources, order);
    
    if (!selectedSource) {
      console.log(`ℹ️ No commission source selected for order ${order.id} after conflict resolution`);
      return [];
    }

    console.log(`✅ Selected commission source for order ${order.id}:`, {
      type: selectedSource.type,
      affiliateUserId: selectedSource.affiliateUserId,
      priority: selectedSource.priority
    });

    // 🎯 Step 3: Apply affiliate info to order and process commission
    await this.orderRepo.update(order.id, {
      affiliate_code: selectedSource.affiliateCode,
      affiliate_user_id: selectedSource.affiliateUserId,
      affiliate_program_id: selectedSource.programId,
    } as any);

    // 🎯 Step 4: Process commission using existing logic
    await this.handleOrderPaid(order.id);

    return [{
      orderId: order.id,
      source: selectedSource,
      processed: true
    }];
  }

  /**
   * Resolve conflicts when multiple commission sources apply to same order
   */
  private resolveCommissionConflict(sources: any[], order: any) {
    if (sources.length === 1) {
      return sources[0];
    }

    console.log(`🔀 Resolving commission conflict for order ${order.id} with ${sources.length} sources`);

    // Rule 1: Member-specific affiliate takes priority over group-level
    const memberSpecific = sources.find(s => s.type === 'member_specific');
    if (memberSpecific) {
      console.log(`✅ Member-specific affiliate wins for order ${order.id}`);
      return memberSpecific;
    }

    // Rule 2: Highest priority wins
    const sortedByPriority = sources.sort((a, b) => a.priority - b.priority);
    const winner = sortedByPriority[0];
    
    console.log(`✅ Priority-based winner for order ${order.id}:`, winner.type);
    return winner;
  }
}