import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CommissionCalcService } from '../service/commission-calc.service';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateCommission } from '../entity/affiliate-commission.entity';

@Controller('admin/affiliate-commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionAdminController {
  constructor(
    private readonly calc: CommissionCalcService,
    @InjectRepository(AffiliateCommission)
    private readonly commissionRepo: Repository<AffiliateCommission>,
  ) {}

  @Post('recalc-order/:orderId')
  @Roles('Admin')
  async recalc(@Param('orderId', ParseIntPipe) orderId: number) {
    await this.calc.handleOrderPaid(orderId);
    return { success: true };
  }

  @Get('logs')
  @Roles('Admin')
  async getCommissionLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('userId') userId?: number,
    @Query('programId') programId?: number,
    @Query('status') status?: string,
  ) {
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.commissionRepo
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.beneficiary_user_id', 'user')
      .leftJoinAndSelect('user.user_info', 'user_info')
      .leftJoinAndSelect('commission.link_id', 'link')
      .leftJoinAndSelect('commission.order_item_id', 'order_item')
      .leftJoinAndSelect('order_item.product_id', 'product')
      .leftJoinAndSelect('order_item.order_id', 'order')
      .orderBy('commission.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    // Filters
    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }
    if (programId) {
      queryBuilder.andWhere('commission.program_id = :programId', { programId });
    }
    if (status) {
      queryBuilder.andWhere('commission.status = :status', { status });
    }

    const [commissions, total] = await queryBuilder.getManyAndCount();

    return {
      data: commissions.map(comm => ({
        id: comm.id,
        uuid: comm.uuid,
        amount: parseFloat(String(comm.amount)),
        status: comm.status,
        level: comm.level,
        rate_percent: comm.rate_percent ? parseFloat(String(comm.rate_percent)) : null,
        base_amount: comm.base_amount ? parseFloat(String(comm.base_amount)) : null,
        computed_amount: comm.computed_amount ? parseFloat(String(comm.computed_amount)) : null,
        created_at: comm.created_at,
        paid_at: comm.paid_at,
        program_id: comm.program_id,
        user: comm.beneficiary_user_id ? {
          id: comm.beneficiary_user_id.id,
          email: comm.beneficiary_user_id.email,
          username: comm.beneficiary_user_id.username,
          full_name: (comm.beneficiary_user_id as any).user_info?.full_name || null,
        } : null,
        link: comm.link_id ? {
          id: comm.link_id.id,
          code: comm.link_id.code,
        } : null,
        order: comm.order_item_id?.order ? {
          id: comm.order_item_id.order.id,
          order_number: comm.order_item_id.order.uuid,
          total_amount: parseFloat(String(comm.order_item_id.order.totalAmount || 0)),
          created_at: comm.order_item_id.order.createdAt,
        } : null,
        product: comm.order_item_id?.product ? {
          id: comm.order_item_id.product.id,
          name: comm.order_item_id.product.name,
          image: (comm.order_item_id.product as any).image || null,
        } : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}