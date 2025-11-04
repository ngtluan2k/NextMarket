import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  Param,
  Query,
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
import { Public } from '../../common/decorators/public.decorator';
@ApiTags('user-vouchers')
@ApiBearerAuth()
@Controller('user/vouchers')
@UseGuards(JwtAuthGuard)
export class UserVouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Public()
  @Get('available')
  @ApiOperation({
    summary: 'Lấy danh sách voucher khả dụng cho người dùng',
    description:
      'Có thể filter theo storeId. Nếu không có storeId, trả về tất cả vouchers.',
  })
  @ApiResponse({ status: 200, description: 'Danh sách voucher khả dụng' })
  async getAvailableVouchers(
    @Query('storeId') storeId?: string,
    @Query('filterByStore') filterByStore?: string,
    @Req() req?: any
  ) {
    const userId = req.user?.sub || null;
    const storeIdNum = storeId ? parseInt(storeId, 10) : undefined;
    const filterByStoreOnly = ['true', '1', true].includes(
      filterByStore as any
    );
    console.log('🧩 Query received:', {
      storeId,
      filterByStore,
      filterByStoreOnly,
    });
    return this.vouchersService.getAvailableVouchers(
      userId,
      storeIdNum,
      filterByStoreOnly
    );
  }

  @Post('collect/:id')
  @ApiOperation({ summary: 'Thu thập voucher' })
  @ApiResponse({ status: 200, description: 'Voucher được thu thập thành công' })
  async collectVoucher(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.sub;
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
    const userId = req.user?.sub;
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
  @Get('my-vouchers')
  @ApiOperation({ summary: 'Lấy danh sách voucher mà user ĐÃ THU THẬP' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách voucher đã thu thập của user',
  })
  async getUserCollectedVouchers(@Req() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.getUserCollectedVouchers(userId);
  }

  @Get('available-for-collection')
  @ApiOperation({ summary: 'Lấy danh sách voucher CÓ THỂ THU THẬP' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách voucher user có thể thu thập',
  })
  async getAvailableVouchersForCollection(@Req() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.getAvailableVouchersForCollection(userId);
  }
}
