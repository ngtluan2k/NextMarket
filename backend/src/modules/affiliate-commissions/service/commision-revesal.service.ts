import { Injectable, Logger } from "@nestjs/common";
import { AffiliateCommission } from "../entity/affiliate-commission.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { WalletService } from "../../wallet/wallet.service";


@Injectable()
export class CommissionRevesalService{
  private readonly logger = new Logger(CommissionRevesalService.name);

  constructor(
    @InjectRepository(AffiliateCommission)
    private readonly commissionRepo: Repository<AffiliateCommission>,
    private readonly walletService: WalletService,
  ){}

   async reverseCommissionForOrder(orderId: number, reason: string) {
    this.logger.log(`Reversing commission for order: ${orderId}, reason: ${reason}`);

    const commissions = await this.commissionRepo.find({
      where:{
        related_order_id : orderId,
        status : 'PAID'
      },
      relations: ['beneficiary_user_id'],
    })

    if (commissions.length === 0) {
      this.logger.warn(`No paid commissions found for order ${orderId}`);
      return { reversed: 0, message: 'No commissions to reverse' };
    }

    // ✅ Wrap tất cả operations trong transaction
    return await this.commissionRepo.manager.transaction(async (manager) => {
      let totalReversed = 0;

      for (const commission of commissions) {
        // Update commission status
        commission.status = 'REVERSED';
        commission.reversed_amount = commission.amount;
        commission.reversed_at = new Date();
        commission.reversal_reason = reason;
        
        // Trừ tiền từ wallet của user
        try {
          const userId = commission.beneficiary_user_id.id;
          await this.walletService.deductCommissionFromWallet(
            userId,
            Number(commission.amount),
            commission.id.toString(),
            reason,
            manager  // ✅ Pass manager để dùng CÙNG transaction
          );
          this.logger.log(`💸 Deducted ${commission.amount} from user ${userId} wallet`);
        } catch (error) {
          this.logger.error(`Failed to deduct from wallet for commission ${commission.id}:`, error);
          throw error; // Throw để rollback toàn bộ transaction
        }
        
        // ✅ Save commission với transaction manager
        await manager.save(AffiliateCommission, commission);
        totalReversed += Number(commission.amount);
        this.logger.log(`Reversed commission ${commission.id}: ${commission.amount}`);
      }

      this.logger.log(`✅ Successfully reversed ${commissions.length} commissions, total: ${totalReversed}`);

      return {
        reversed: commissions.length,  
        totalAmount: totalReversed,
        message: `Successfully reversed ${commissions.length} commissions`
      };
    });
  }
  
  // Void commission khi cancel (trước khi paid)
  async voidCommissionForOrder(orderId: number) {
    this.logger.log(`Voiding commissions for order: ${orderId}`);

    const commissions = await this.commissionRepo.find({
      where: {
        related_order_id: orderId,
        status: 'PENDING',  // Chỉ void những commission chưa paid
      },
    });

    if (commissions.length === 0) {
      this.logger.warn(`No pending commissions found for order ${orderId}`);
      return { voided: 0, message: 'No pending commissions to void' };
    }

    // ✅ Wrap trong transaction
    return await this.commissionRepo.manager.transaction(async (manager) => {
      for (const commission of commissions) {
        // Update status thành VOIDED
        commission.status = 'VOIDED';
        commission.reversed_at = new Date();
        commission.reversal_reason = 'ORDER_CANCELLED';

        // KHÔNG trừ balance vì commission chưa được paid
        // Save commission
        await manager.save(AffiliateCommission, commission);
        
        this.logger.log(`Voided commission ${commission.id}: ${commission.amount}`);
      }

      this.logger.log(`✅ Successfully voided ${commissions.length} commissions`);

      return {
        voided: commissions.length,
        message: `Successfully voided ${commissions.length} commissions`,
      };
    });
  }
  
  // Partial reversal (refund 1 phần)
  async partialReversalForOrderItem(orderItemId: number, refundAmount: number) {
    this.logger.log(`Partial reversal for order item: ${orderItemId}, refund: ${refundAmount}`);

    const commissions = await this.commissionRepo.find({
      where: {
        order_item_id: { id: orderItemId } as any,
        status: 'PAID',
      },
      relations: ['order_item_id', 'beneficiary_user_id'],
    });

    if (commissions.length === 0) {
      this.logger.warn(`No paid commissions found for order item ${orderItemId}`);
      return { reversed: 0, message: 'No commissions found for this item' };
    }

    // ✅ Wrap trong transaction
    return await this.commissionRepo.manager.transaction(async (manager) => {
      let totalReversed = 0;

      for (const commission of commissions) {
        // Tính commission cần reverse
        // Công thức: reversalAmount = (refundAmount / originalItemPrice) * commission.amount
        const originalPrice = Number((commission.order_item_id as any).price || (commission.order_item_id as any).subtotal);
        
        if (!originalPrice || originalPrice <= 0) {
          this.logger.warn(`Invalid original price for order item ${orderItemId}`);
          continue;
        }

        const reversalRatio = Number(refundAmount) / originalPrice;
        const reversalAmount = Number(commission.amount) * reversalRatio;

        // Round to 2 decimal places
        const roundedReversalAmount = Math.round(reversalAmount * 100) / 100;

        this.logger.log(
          `Partial reversal: Original price=${originalPrice}, Refund=${refundAmount}, ` +
          `Ratio=${reversalRatio.toFixed(2)}, Commission=${commission.amount}, ` +
          `Reversal=${roundedReversalAmount}`
        );

        // Update commission
        commission.reversed_amount = roundedReversalAmount;
        commission.reversed_at = new Date();
        commission.reversal_reason = 'PARTIAL_REFUND';
        // Status vẫn là PAID nếu chỉ reverse 1 phần, hoặc REVERSED nếu reverse toàn bộ
        if (reversalRatio >= 1) {
          commission.status = 'REVERSED';
        }

        // Trừ tiền từ wallet
        try {
          const userId = commission.beneficiary_user_id.id;
          await this.walletService.deductCommissionFromWallet(
            userId,
            roundedReversalAmount,
            commission.id.toString(),
            'PARTIAL_REFUND',
            manager  // ✅ Pass manager
          );
          this.logger.log(`💸 Deducted ${roundedReversalAmount} from user ${userId} wallet (partial)`);
        } catch (error) {
          this.logger.error(`Failed to deduct from wallet for commission ${commission.id}:`, error);
          throw error;  // Rollback toàn bộ transaction
        }

        // Save commission
        await manager.save(AffiliateCommission, commission);
        totalReversed += roundedReversalAmount;
      }

      this.logger.log(`✅ Successfully reversed ${commissions.length} commissions, total: ${totalReversed}`);

      return {
        reversed: commissions.length,
        totalAmount: totalReversed,
        message: `Partial reversal completed for ${commissions.length} commissions`,
      };
    });
  }

}