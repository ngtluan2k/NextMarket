import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';

@ApiTags('user-vouchers')
@ApiBearerAuth()
@Controller('user/vouchers')
@UseGuards(JwtAuthGuard)
export class UserVouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('available')
  @ApiOperation({ summary: 'Lấy danh sách voucher khả dụng cho người dùng' })
  @ApiResponse({ status: 200, description: 'Danh sách voucher khả dụng' })
  async getAvailableVouchers(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.getAvailableVouchers(userId);
  }

  @Post('collect/:id')
  @ApiOperation({ summary: 'Thu thập voucher' })
  @ApiResponse({ status: 200, description: 'Voucher được thu thập thành công' })
  async collectVoucher(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.collectVoucher(id, userId);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Áp dụng voucher vào đơn hàng' })
  @ApiResponse({ status: 200, description: 'Voucher được áp dụng thành công' })
  async applyVoucher(
    @Body() applyVoucherDto: ApplyVoucherDto,
    @Req() req: any
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.validateVoucher(
      applyVoucherDto.code,
      userId,
      applyVoucherDto.orderItems,
      applyVoucherDto.storeId
    );
  }
}
