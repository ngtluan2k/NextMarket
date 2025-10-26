// modules/affiliate-commissions/commission-calc.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

// Entities
import { Order } from '../orders/order.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { AffiliateCommission } from '../affiliate-commissions/affiliate-commission.entity';

// Services
import { AffiliateRulesService } from '../affiliate-rules/affiliate-rules.service';
import { User } from '../user/user.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';

@Injectable()
export class CommissionCalcService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(AffiliateLink) private readonly linkRepo: Repository<AffiliateLink>,
    @InjectRepository(AffiliateCommission) private readonly commRepo: Repository<AffiliateCommission>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AffiliateProgram) private readonly programRepo: Repository<AffiliateProgram>,
    private readonly rulesService: AffiliateRulesService,
  ) {}

  // Hàm gọi khi đơn hàng chuyển sang PAID
  async handleOrderPaid(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return;

    // Xác định cấp 0: chủ link > affiliate_user_id
    let level0UserId: number | null = null;
    let programId: number | null = null;

    if ((order as any).affiliate_link_id) {
      const link = await this.linkRepo.findOne({
        where: { id: (order as any).affiliate_link_id },
        relations: ['program_id', 'user_id'],
      });
      if ((link as any)?.user_id?.id) level0UserId = (link as any).user_id.id;
      if ((link as any)?.program_id?.id) programId = (link as any).program_id.id;
    } else if ((order as any).affiliate_user_id) {
      level0UserId = (order as any).affiliate_user_id;
      programId = null; // rule mặc định (program_id null)
    }

    // Check if program is active before proceeding
    if (programId) {
      const program = await this.programRepo.findOne({ where: { id: programId } });
      if (!program || program.status !== 'active') {
        return; // Skip commission calculation for inactive programs
      }
    }

    if (!level0UserId) {
      return; // không có affiliate -> không tạo hoa hồng
    }

    // Lấy các item đủ điều kiện
    const items = await this.orderItemRepo.find({
      where: { order_id: { id: (order as any).id } as any },
      relations: [],
    });

    // Tính base_amount theo policy (ví dụ dùng subtotal)
    for (const item of items) {
      const baseAmount = Number((item as any).subtotal ?? 0);
      if (baseAmount <= 0) continue;

      // chặn self-commission nếu policy không cho
      if ((order as any).user_id && (order as any).user_id === level0UserId) {
        continue;
      }

      // Level 0
      await this.allocateLevel(order, item, level0UserId, 0, programId, baseAmount);

      // Có thể mở rộng cho Level 1..N:
      // Với yêu cầu hiện tại (không MLM), bạn dừng ở Level 0.
      // Nếu muốn đa cấp, thêm truy vấn sponsor/closure table để tìm ancestor & tăng level.
    }
  }

  private async allocateLevel(
    order: Order,
    item: OrderItem,
    beneficiaryUserId: number,
    level: number,
    programId: number | null,
    baseAmount: number,
  ) {
    const now = new Date();
    const rule = await this.rulesService.getActiveRule(programId, level, now);
    if (!rule) return;

    const rate = Number((rule as any).rate_percent);
    let computed = Math.max(0, baseAmount * (rate / 100));
    if ((rule as any).cap_per_order != null) {
      const cap = Number((rule as any).cap_per_order);
      if (!Number.isNaN(cap) && cap >= 0) computed = Math.min(computed, cap);
    }
    computed = Math.round(computed * 100) / 100;

    if (computed <= 0) return;

    const rec = this.commRepo.create({
      order_item_id: (item as any).id,
      payer_user_id: (order as any).user_id as any,           // có thể là number hoặc relation tùy entity
      beneficiary_user_id: beneficiaryUserId,
      program_id: programId,
      level,
      base_amount: baseAmount,
      rate_percent: rate,
      computed_amount: computed,
      amount: computed,                               // giữ compat cột amount cũ
      status: 'PENDING',
      created_at: new Date(),
      link_id: (order as any).affiliate_link_id ?? null,       // ghi lại nguồn link nếu có
    } as any);

    await this.commRepo.save(rec);
  }
}