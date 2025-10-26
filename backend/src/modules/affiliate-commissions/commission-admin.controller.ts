import { Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CommissionCalcService } from './commission-calc.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';

@Controller('admin/affiliate-commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionAdminController {
  constructor(private readonly calc: CommissionCalcService) {}

  @Post('recalc-order/:orderId')
  @Roles('Admin')
  async recalc(@Param('orderId', ParseIntPipe) orderId: number) {
    await this.calc.handleOrderPaid(orderId);
    return { success: true };
  }
}