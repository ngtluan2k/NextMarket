// modules/affiliate-commissions/commission-calc.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities
import { Order } from '../../orders/order.entity';
import { OrderItem } from '../../order-items/order-item.entity';
import { AffiliateCommission } from '../entity/affiliate-commission.entity';

// Services
import { AffiliateRulesService } from '../../affiliate-rules/affiliate-rules.service';
import { WalletService } from '../../wallet/wallet.service';
import { FraudDetectionService } from '../../affiliate-fraud/service/fraud-detection.service';
import { BudgetTrackingService } from '../../affiliate-program/service/budget-tracking.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { User } from '../../user/user.entity';
import { AffiliateProgram } from '../../affiliate-program/affiliate-program.entity';

@Injectable()
export class CommissionCalcService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(AffiliateCommission) private readonly commRepo: Repository<AffiliateCommission>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AffiliateProgram) private readonly programRepo: Repository<AffiliateProgram>,
    private readonly rulesService: AffiliateRulesService,
    private readonly walletService: WalletService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly budgetTrackingService: BudgetTrackingService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // Hàm gọi khi đơn hàng chuyển sang PAID
  async handleOrderPaid(orderId: number) {
    try {
      console.log(`🎯 Starting commission calculation for order ${orderId}`);
      
      const order = await this.orderRepo.findOne({ 
        where: { id: orderId },
        relations: ['user'] // Load user relation for better type safety
      });
      
      if (!order) {
        console.warn(`⚠️ Order ${orderId} not found for commission calculation`);
        return;
      }

      // 🐛 DEBUG: Log all affiliate fields from the order
      console.log(`🔍 DEBUG - Order ${orderId} affiliate fields:`, {
        affiliate_code: (order as any).affiliate_code,
        affiliate_user_id: (order as any).affiliate_user_id,
        affiliate_program_id: (order as any).affiliate_program_id,
        affiliate_link_id: (order as any).affiliate_link_id,
      });

      // Xác định affiliate trực tiếp (level 0 trong chuỗi giới thiệu, nhận hoa hồng level 1)
      // level0UserId = người tạo link affiliate (direct referrer)
      // Họ sẽ nhận commission rate của "level 1" từ rule
      let level0UserId: number | null = null;
      let programId: number | null = null;
      let linkId: number | null = null;

      if ((order as any).affiliate_user_id) {
        level0UserId = Number((order as any).affiliate_user_id);
        programId = (order as any).affiliate_program_id ? Number((order as any).affiliate_program_id) : null;
        linkId =(order as any).affiliate_link_id ? Number((order as any).affiliate_link_id) : null;
        console.log(`👤 Using affiliate user: ${level0UserId}, program: ${programId},  link: ${linkId}`);
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
          return; // Skip commission calculation for inactive programs
        }
        console.log(`✅ Using active affiliate program: ${program.name}`);
      }

      if (!level0UserId) {
        console.log(`ℹ️ No affiliate tracking found for order ${orderId}`);
        return; // không có affiliate -> không tạo hoa hồng
      }

      // Improved self-commission check with strict type comparison
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
        // Block commission creation if fraud is detected
        return;
      }
      console.log(`✅ Fraud checks passed for order ${orderId}`);

      // 💰 Check budget availability before processing
      if (programId) {
        // Calculate total potential commission amount
        const items = await this.orderItemRepo.find({
          where: { order: { id: order.id } },
          relations: ['product'],
        });

        let totalPotentialCommission = 0;
        for (const item of items) {
          const baseAmount = Number((item as any).subtotal ?? 0);
          if (baseAmount > 0) {
            // Estimate commission (assuming average 10% rate for budget check)
            // This is a rough estimate; actual rates will be calculated later
            totalPotentialCommission += baseAmount * 0.1;
          }
        }

        console.log(`💰 Checking budget for program ${programId}, estimated commission: ${totalPotentialCommission.toFixed(2)}`);
        
        const budgetCheck = await this.budgetTrackingService.checkBudgetAvailable(
          programId,
          totalPotentialCommission,
        );

        if (!budgetCheck.available) {
          console.warn(`⚠️ Budget limit reached for program ${programId}: ${budgetCheck.reason}`);
          // TODO: Send notification to admin about budget limit
          return;
        }
        
        console.log(`✅ Budget check passed for program ${programId}`);
      }

      // Lấy các item đủ điều kiện
      const items = await this.orderItemRepo.find({
        where: { order: { id: order.id } },
        relations: ['product'],
      });

      if (!items || items.length === 0) {
        console.warn(`⚠️ No order items found for order ${orderId}`);
        return;
      }

      console.log(`📦 Processing ${items.length} items for commission calculation`);

      // Tính base_amount theo policy (ví dụ dùng subtotal)
      for (const item of items) {
        const baseAmount = Number((item as any).subtotal ?? 0);
        if (baseAmount <= 0) {
          console.log(`⏭️ Skipping item ${item.id} with zero/negative amount: ${baseAmount}`);
          continue;
        }

        console.log(`💰 Processing item ${item.id} with base amount: ${baseAmount}`);

        // Level 1 - wrap in try-catch for individual item error handling
        try {
          await this.allocateLevel(order, item, level0UserId, 1, programId, linkId, baseAmount);
        } catch (error) {
          console.error(`❌ Failed to allocate commission for item ${item.id}:`, error);
          // Continue with other items even if one fails
        }

        // Có thể mở rộng cho Level 2..N:
        // Với yêu cầu hiện tại (không MLM), bạn dừng ở Level 1.
        // Nếu muốn đa cấp, thêm truy vấn sponsor/closure table để tìm ancestor & tăng level.
      }
      
      console.log(`✅ Commission calculation completed for order ${orderId}`);
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
}