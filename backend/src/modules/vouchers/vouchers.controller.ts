import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

@ApiTags('vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách voucher đang hoạt động' })
  @ApiResponse({ status: 200, description: 'Danh sách các voucher hoạt động' })
  async getActiveVouchers(@Req() req: any) {
    const userId = req.user?.userId;
    return this.vouchersService.getActiveVouchers(userId);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xác thực mã voucher' })
  @ApiResponse({ status: 200, description: 'Kết quả xác thực voucher' })
  async validateVoucher(@Body() validateVoucherDto: ValidateVoucherDto, @Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.validateVoucher(validateVoucherDto, userId);
  }
}