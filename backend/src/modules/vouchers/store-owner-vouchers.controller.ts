import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-vouchers.dto';
import { UpdateVoucherDto } from './dto/update-vouchers.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';

@ApiTags('store-owner-vouchers')
@ApiBearerAuth()
@Controller('store-owner/vouchers')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class StoreOwnerVouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @Permissions('add_voucher')
  @ApiOperation({ summary: 'Tạo voucher mới cho store' })
  @ApiResponse({ status: 201, description: 'Voucher được tạo thành công' })
  async create(@Body() createVoucherDto: CreateVoucherDto, @Req() req: any) {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.create(createVoucherDto, userId, role);
  }

  @Get()
  @Permissions('view_voucher')
  @ApiOperation({ summary: 'Lấy danh sách voucher của store' })
  @ApiResponse({ status: 200, description: 'Danh sách voucher' })
  async findAll(@Req() req: any) {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.findAll(userId, role);
  }

  @Get(':id')
  @Permissions('view_voucher')
  @ApiOperation({ summary: 'Lấy chi tiết voucher của store' })
  @ApiResponse({ status: 200, description: 'Thông tin voucher' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.findOne(id, userId, role);
  }

  @Patch(':id')
  @Permissions('update_voucher')
  @ApiOperation({ summary: 'Cập nhật voucher của store' })
  @ApiResponse({ status: 200, description: 'Voucher được cập nhật thành công' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVoucherDto: UpdateVoucherDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.update(id, updateVoucherDto, userId, role);
  }

  @Delete(':id')
  @Permissions('delete_voucher')
  @ApiOperation({ summary: 'Xóa voucher của store' })
  @ApiResponse({ status: 200, description: 'Voucher được xóa thành công' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.vouchersService.remove(id, userId, role);
  }
}