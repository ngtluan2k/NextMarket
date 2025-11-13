import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';
import { WalletTransaction } from '../wallet_transaction/wallet_transaction.entity';

@Controller('debug')
export class DebugController {
  constructor(
    @InjectRepository(AffiliateCommission)
    private readonly commissionRepo: Repository<AffiliateCommission>,
    @InjectRepository(WalletTransaction)
    private readonly walletRepo: Repository<WalletTransaction>,
  ) {}

  @Get('commissions')
  async getCommissions() {
    console.log('🔍 [Debug] Fetching all commission records...');
    
    const commissions = await this.commissionRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.beneficiary_user_id', 'user')
      .leftJoinAndSelect('c.link_id', 'link')
      .leftJoinAndSelect('c.order_item_id', 'orderItem')
      .select([
        'c.id',
        'c.amount',
        'c.status',
        'c.level',
        'c.rate_percent',
        'c.program_id',
        'c.created_at',
        'user.id',
        'user.email',
        'user.username',
        'link.id',
        'link.code',
        'orderItem.id'
      ])
      .orderBy('c.created_at', 'DESC')
      .limit(50)
      .getMany();

    console.log(`📊 [Debug] Found ${commissions.length} commission records`);
    
    // Log sample commission structure
    if (commissions.length > 0) {
      console.log('📋 [Debug] Sample commission:', {
        id: commissions[0].id,
        amount: commissions[0].amount,
        beneficiary_user_id: commissions[0].beneficiary_user_id,
        status: commissions[0].status,
        level: commissions[0].level,
        program_id: commissions[0].program_id
      });
    }

    return commissions;
  }

  @Get('wallet-transactions')
  async getWalletTransactions() {
    console.log('🔍 [Debug] Fetching wallet transactions...');
    
    const transactions = await this.walletRepo
      .createQueryBuilder('wt')
      .leftJoinAndSelect('wt.user_id', 'user')
      .select([
        'wt.id',
        'wt.amount',
        'wt.transaction_type',
        'wt.description',
        'wt.created_at',
        'user.id',
        'user.email',
        'user.username'
      ])
      .where("wt.description LIKE '%commission%' OR wt.description LIKE '%hoa hồng%'")
      .orderBy('wt.created_at', 'DESC')
      .limit(50)
      .getMany();

    console.log(`📊 [Debug] Found ${transactions.length} commission-related wallet transactions`);

    return transactions;
  }

  @Get('commission-summary/:userId')
  async getCommissionSummaryForUser(@Param('userId') userId: string) {
    const userIdNum = parseInt(userId, 10);
    console.log(`🔍 [Debug] Getting commission summary for user ${userIdNum}...`);

    // Direct query to check commission data using correct column
    const directCommissions = await this.commissionRepo
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.amount',
        'c.status',
        'c.level',
        'c.program_id',
        'c.beneficiary_user_id'
      ])
      .where('c.beneficiary_user_id = :userId', { userId: userIdNum })
      .getRawMany();

    console.log(`📊 [Debug] Direct commissions for user ${userIdNum}:`, directCommissions);

    // Aggregated summary using correct column
    const summary = await this.commissionRepo
      .createQueryBuilder('c')
      .select([
        "SUM(CASE WHEN c.status = 'PENDING' THEN c.amount ELSE 0 END) as totalPending",
        "SUM(CASE WHEN c.status = 'PAID' THEN c.amount ELSE 0 END) as totalPaid",
        'SUM(c.amount) as totalEarned',
        'COUNT(c.id) as totalCount'
      ])
      .where('c.beneficiary_user_id = :userId', { userId: userIdNum })
      .getRawOne();

    console.log(`📊 [Debug] Summary for user ${userIdNum}:`, summary);

    return {
      userId: userIdNum,
      directCommissions,
      summary,
      totalRecords: directCommissions.length
    };
  }

  @Get('test-commission-query/:userId')
  async testCommissionQuery(@Param('userId') userId: string) {
    const userIdNum = parseInt(userId, 10);
    console.log(`🧪 [Test] Testing commission query for user ${userIdNum}...`);

    // Test the exact same query as affiliate-tree service
    const result = await this.commissionRepo
      .createQueryBuilder('c')
      .select([
        'c.beneficiary_user_id as userId',
        "SUM(CASE WHEN c.status = 'PENDING' THEN c.amount ELSE 0 END) as totalPending",
        "SUM(CASE WHEN c.status = 'PAID' THEN c.amount ELSE 0 END) as totalPaid",
        'SUM(c.amount) as totalEarned',
        'AVG(c.rate_percent) as avgRatePercent'
      ])
      .where('c.beneficiary_user_id IN (:...userIds)', { userIds: [userIdNum] })
      .groupBy('c.beneficiary_user_id')
      .getRawMany();

    console.log(`🧪 [Test] Query result:`, result);

    return {
      userId: userIdNum,
      queryResult: result,
      hasData: result.length > 0,
      summary: result[0] || null
    };
  }
}
