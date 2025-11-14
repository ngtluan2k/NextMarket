import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AffiliateCommissionsService } from '../service/affiliate-commissions.service';
import { CreateAffiliateCommissionDto } from '../dto/create-affiliate-commission.dto';
import { UpdateAffiliateCommissionDto } from '../dto/update-affiliate-commission.dto';
import { CommissionCalcService } from '../service/commission-calc.service';
import { CommissionRevesalService } from '../service/commision-revesal.service';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../../common/auth/permission.guard';
import { RequirePermissions } from '../../../common/auth/permission.decorator';
@Controller('affiliate-commissions')
export class AffiliateCommissionsController {
  constructor(
    private readonly service: AffiliateCommissionsService,
    private readonly commissionCalcService: CommissionCalcService,
    private readonly reversalService: CommissionRevesalService,
  ) {}

  @Post()
  create(@Body() createDto: CreateAffiliateCommissionDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAffiliateCommissionDto
  ) {
    return this.service.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Post('recalculate/:orderId')
  async recalculateCommission(@Param('orderId', ParseIntPipe) orderId: number) {
    try {
      console.log(`🔄 Manual recalculation requested for order ${orderId}`);
      await this.commissionCalcService.handleOrderPaid(orderId);
      return {
        success: true,
        message: `Commission calculation triggered for order ${orderId}`,
      };
    } catch (error: any) {
      console.error(`❌ Recalculation failed:`, error);
      return {
        success: false,
        error: error?.message || 'Unknown error',
      };
    }
  }

  // ============ REVERSAL ENDPOINTS ============

  @Post('reverse/:orderId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  async reverseCommission(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() body: { reason: string }
  ) {
    try {
      const result = await this.reversalService.reverseCommissionForOrder(
        orderId,
        body.reason || 'MANUAL_REVERSAL'
      );
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Reversal failed',
      };
    }
  }

  @Post('void/:orderId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  async voidCommission(@Param('orderId', ParseIntPipe) orderId: number) {
    try {
      const result = await this.reversalService.voidCommissionForOrder(orderId);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Void failed',
      };
    }
  }

  @Post('partial-reverse/:orderItemId')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('manage_affiliate')
  async partialReverseCommission(
    @Param('orderItemId', ParseIntPipe) orderItemId: number,
    @Body() body: { refundAmount: number }
  ) {
    try {
      const result = await this.reversalService.partialReversalForOrderItem(
        orderItemId,
        body.refundAmount
      );
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Partial reversal failed',
      };
    }
  }

  @Get('reversal-history')
  @UseGuards(JwtAuthGuard)
  async getReversalHistory(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    try {
      const userId = req.user.id;
      
      // Get reversed commissions for this user
      const reversedCommissions = await this.service.findReversedByUser(
        userId,
        page,
        limit
      );
      
      return {
        success: true,
        data: reversedCommissions,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to fetch reversal history',
      };
    }
  }
}
