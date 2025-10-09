import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { CalculateDiscountDto } from './dto/calculate-discount.dto';
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
    if (!userId) throw new BadRequestException('Người dùng chưa được xác thực');
    return this.vouchersService.getAvailableVouchers(userId);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Xác thực mã voucher' })
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Kết quả xác thực voucher' })
  async validateVoucher(
    @Body() validateVoucherDto: ValidateVoucherDto,
    @Req() req: any
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('Người dùng chưa được xác thực');

    const { code, order_amount, store_id } = validateVoucherDto;
    const orderItems = [{ productId: 0, quantity: 1, price: order_amount }];

    return this.vouchersService.validateVoucher(
      code,
      userId,
      orderItems,
      store_id ?? 0
    );
  }

  @Post('calculate-discount')
  @ApiOperation({ summary: 'Tính toán chiết khấu từ danh sách mã voucher' })
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Tổng chiết khấu và danh sách voucher áp dụng',
  })
  async calculateDiscount(
    @Body() calculateDiscountDto: CalculateDiscountDto,
    @Req() req: any
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('Người dùng chưa được xác thực');

    return this.vouchersService.calculateDiscount(
      calculateDiscountDto.voucherCodes,
      userId,
      calculateDiscountDto.orderItems,
      calculateDiscountDto.storeId,
      calculateDiscountDto.orderAmount
    );
  }
}
