import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { AffiliateCommissionsService } from './affiliate-commissions.service';
import { CreateAffiliateCommissionDto } from './dto/create-affiliate-commission.dto';
import { UpdateAffiliateCommissionDto } from './dto/update-affiliate-commission.dto';
import { CommissionCalcService } from './commission-calc.service';

@Controller('affiliate-commissions')
export class AffiliateCommissionsController {
  constructor(
    private readonly service: AffiliateCommissionsService,
    private readonly commissionCalcService: CommissionCalcService,
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
}
