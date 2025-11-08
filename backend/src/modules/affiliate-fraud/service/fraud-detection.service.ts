import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AffiliateFraudLog } from '../entity/affiliate-fraud-log.entity';
import { Order } from '../../orders/order.entity';

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

    // Check if same products (simplified check)
    const isDuplicate = recentOrders.length > 5; // More than 5 orders in 24h

    if (isDuplicate) {
      await this.logFraud({
        type: 'DUPLICATE_ORDER',
        details: { user_id: userId, recent_order_count: recentOrders.length },
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

  // Run all checks
  async runFraudChecks(order: {
    user_id: number;
    affiliate_user_id?: number;
    ip_address?: string;
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

    const fraudDetected = Object.values(checks).some((check) => check === true);

    return {
      fraudDetected,
      checks,
    };
  }

  // Get fraud logs
  async getFraudLogs(page: number = 1, limit: number = 20) {
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
