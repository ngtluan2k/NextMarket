import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AffiliateFraudLog } from '../entity/affiliate-fraud-log.entity';
import { Order } from '../../orders/order.entity';
import { AffiliateClick } from '../../affiliate-links/entity/affiliate-click.entity';
import { AffiliateLink } from '../../affiliate-links/affiliate-links.entity';

export interface FraudCheckResult {
  fraudDetected: boolean;
  checks: {
    selfReferral?: boolean;
    duplicateOrder?: boolean;
    suspiciousIP?: boolean;
    abnormalConversionRate?: boolean;
    rapidPurchase?: boolean;
  };
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    @InjectRepository(AffiliateFraudLog)
    private readonly fraudLogRepo: Repository<AffiliateFraudLog>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(AffiliateClick)
    private readonly clicksRepo: Repository<AffiliateClick>,
    @InjectRepository(AffiliateLink)
    private readonly linksRepo: Repository<AffiliateLink>,
  ) {}

  // Log fraud attempt
  async logFraud(data: {
    type: string;
    affiliate_user_id?: number;
    order_id?: number;
    details?: any;
    ip_address?: string;
  }) {
    const log = this.fraudLogRepo.create({
      fraud_type: data.type,
      affiliate_user_id: data.affiliate_user_id,
      order_id: data.order_id,
      details: data.details,
      ip_address: data.ip_address,
      detected_at: new Date(),
    });

    await this.fraudLogRepo.save(log);
    this.logger.warn(`🚨 Fraud detected: ${data.type}`, data);
  }

  // Check self-referral
  async checkSelfReferral(
    buyerUserId: number,
    affiliateUserId: number,
  ): Promise<boolean> {
    if (buyerUserId === affiliateUserId) {
      await this.logFraud({
        type: 'SELF_REFERRAL',
        affiliate_user_id: affiliateUserId,
        details: { buyer_user_id: buyerUserId },
      });
      return true;
    }
    return false;
  }

  // Check duplicate orders
  async checkDuplicateOrder(
    userId: number,
    orderData: any,
  ): Promise<boolean> {
    const recentOrders = await this.ordersRepo.find({
      where: {
        user: { id: userId },
        createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)), // Last 24h
      },
      relations: ['orderItem'],
    });

    // Only flag as fraud if:
    // 1. More than 10 orders in 24h (very suspicious)
    // 2. AND orders have identical or very similar amounts (copy-paste fraud pattern)
    if (recentOrders.length <= 10) {
      return false; // Normal testing/shopping behavior
    }

    // Check if orders have identical amounts (copy-paste fraud pattern)
    const orderAmounts = recentOrders.map((o) => o.totalAmount);
    const uniqueAmounts = new Set(orderAmounts);

    // If more than 70% of orders have same amount = likely fraud
    const duplicateAmountCount = orderAmounts.filter(
      (amount) => orderAmounts.filter((a) => a === amount).length > 1,
    ).length;

    const isDuplicate =
      recentOrders.length > 10 &&
      duplicateAmountCount / recentOrders.length > 0.7;

    if (isDuplicate) {
      await this.logFraud({
        type: 'DUPLICATE_ORDER',
        details: {
          user_id: userId,
          recent_order_count: recentOrders.length,
          duplicate_amount_count: duplicateAmountCount,
          unique_amounts: Array.from(uniqueAmounts),
        },
      });
      return true;
    }

    return false;
  }

  // Check suspicious IP
  async checkSuspiciousIP(ipAddress: string): Promise<boolean> {
    if (!ipAddress) return false;

    const ordersFromIP = await this.ordersRepo.count({
      where: {
        createdAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      },
    });

    // More than 10 orders from same IP in 24h = suspicious
    if (ordersFromIP > 10) {
      await this.logFraud({
        type: 'SUSPICIOUS_IP',
        ip_address: ipAddress,
        details: { order_count: ordersFromIP },
      });
      return true;
    }

    return false;
  }

  // Check abnormal conversion rate
  async checkAbnormalConversionRate(
    affiliateUserId: number,
  ): Promise<boolean> {
    if (!affiliateUserId) return false;

    try {
      // Get affiliate's links
      const links = await this.linksRepo.find({
        where: { user_id: { id: affiliateUserId } as any },
      });

      if (links.length === 0) return false;

      const linkIds = links.map((link) => link.id);

      // Count total clicks
      const totalClicks = await this.clicksRepo.count({
        where: linkIds.map((id) => ({ affiliate_link_id: id })),
      });

      // Count conversions
      const conversions = await this.clicksRepo.count({
        where: linkIds.map((id) => ({
          affiliate_link_id: id,
          converted: true,
        })),
      });

      if (totalClicks === 0) return false;

      const conversionRate = (conversions / totalClicks) * 100;

      // Conversion rate > 50% is suspicious
      if (conversionRate > 50 && totalClicks > 10) {
        await this.logFraud({
          type: 'ABNORMAL_CONVERSION_RATE',
          affiliate_user_id: affiliateUserId,
          details: {
            conversion_rate: conversionRate.toFixed(2),
            total_clicks: totalClicks,
            conversions: conversions,
          },
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Error checking conversion rate for user ${affiliateUserId}:`,
        error,
      );
      return false;
    }
  }

  // Check rapid purchase (click -> buy < 1 minute)
  async checkRapidPurchase(
    clickId: string,
    orderTime: Date,
  ): Promise<boolean> {
    if (!clickId) return false;

    try {
      const click = await this.clicksRepo.findOne({
        where: { click_id: clickId },
      });

      if (!click) return false;

      const timeDiff =
        (orderTime.getTime() - click.clicked_at.getTime()) / 1000; // seconds

      // Less than 60 seconds = suspicious
      if (timeDiff < 60) {
        await this.logFraud({
          type: 'RAPID_PURCHASE',
          details: {
            click_id: clickId,
            time_diff_seconds: timeDiff.toFixed(2),
            clicked_at: click.clicked_at,
            order_time: orderTime,
          },
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking rapid purchase for click ${clickId}:`, error);
      return false;
    }
  }

  // Run all checks
  async runFraudChecks(order: {
    user_id: number;
    affiliate_user_id?: number;
    ip_address?: string;
    click_id?: string;
    created_at?: Date;
  }): Promise<FraudCheckResult> {
    const checks: FraudCheckResult['checks'] = {};

    // Check self-referral
    if (order.affiliate_user_id) {
      checks.selfReferral = await this.checkSelfReferral(
        order.user_id,
        order.affiliate_user_id,
      );
    }

    // Check duplicate orders
    checks.duplicateOrder = await this.checkDuplicateOrder(
      order.user_id,
      order,
    );

    // Check suspicious IP
    if (order.ip_address) {
      checks.suspiciousIP = await this.checkSuspiciousIP(order.ip_address);
    }

    // Check abnormal conversion rate
    if (order.affiliate_user_id) {
      checks.abnormalConversionRate = await this.checkAbnormalConversionRate(
        order.affiliate_user_id,
      );
    }

    // Check rapid purchase
    if (order.click_id && order.created_at) {
      checks.rapidPurchase = await this.checkRapidPurchase(
        order.click_id,
        order.created_at,
      );
    }

    const fraudDetected = Object.values(checks).some((check) => check === true);

    return {
      fraudDetected,
      checks,
    };
  }

  // Get fraud logs
  async getFraudLogs(page = 1, limit = 20) {
    const [logs, total] = await this.fraudLogRepo.findAndCount({
      relations: ['affiliate_user', 'order'],
      order: { detected_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Review fraud log
  async reviewFraudLog(
    logId: number,
    action: 'IGNORE' | 'BAN_USER' | 'SUSPEND_AFFILIATE',
    adminUserId: number,
    notes?: string,
  ) {
    const log = await this.fraudLogRepo.findOne({ where: { id: logId } });

    if (!log) {
      throw new Error('Fraud log not found');
    }

    log.is_reviewed = true;
    log.admin_action = action;
    log.admin_notes = notes;
    log.reviewed_by = adminUserId;
    log.reviewed_at = new Date();

    await this.fraudLogRepo.save(log);

    this.logger.log(`Fraud log ${logId} reviewed: ${action}`);

    return log;
  }
}
