import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('stores')
@ApiBearerAuth('access-token')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('view_store')
  @ApiOperation({ summary: 'Lấy danh sách tất cả stores' })
  async findAll() {
    const stores = await this.storeService.findAll();
    return {
      message: 'Danh sách cửa hàng',
      total: stores.length,
      data: stores,
    };
  }

  @Get('my-store')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy store của tôi' })
  async getMyStore(@Req() req: any) {
    const store = await this.storeService.findByUserId(req.user.sub);
    return {
      message: store ? 'Thông tin store của bạn' : 'Bạn chưa có store',
      data: store,
    };
  }

  @Get('check-seller')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Kiểm tra có phải seller không' })
  async checkSeller(@Req() req: any) {
    const isSeller = await this.storeService.isUserSeller(req.user.sub);
    return {
      message: 'Trạng thái seller',
      data: { is_seller: isSeller },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin store theo ID' })
  async findOne(@Param('id') id: number) {
    const store = await this.storeService.findOne(id);
    return {
      message: 'Chi tiết cửa hàng',
      data: store,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Lấy thống kê store' })
  async getStoreStats(@Param('id') id: number) {
    const stats = await this.storeService.getStoreStats(id);
    return {
      message: 'Thống kê cửa hàng',
      data: stats,
    };
  }

  @Post('register-seller')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đăng ký làm người bán hàng' })
  async registerSeller(@Req() req: any, @Body() dto: RegisterSellerDto) {
    const result = await this.storeService.registerSeller(req.user.sub, dto);
    return {
      message: result.message,
      data: result.store,
    };
  }

  @Post('register-seller')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đăng ký làm người bán hàng' })
  async registerSeller(@Req() req: any, @Body() dto: RegisterSellerDto) {
    const result = await this.storeService.registerSeller(req.user.sub, dto);
    return {
      message: result.message,
      data: result.store,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('create_store')
  @ApiOperation({ summary: 'Tạo store mới (Admin)' })
  async create(@Req() req: any, @Body() dto: CreateStoreDto) {
    const store = await this.storeService.create(req.user.sub, dto);
    return {
      message: 'Tạo cửa hàng thành công',
      data: store,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('update_store')
  @ApiOperation({ summary: 'Cập nhật store' })
  async update(@Param('id') id: number, @Body() dto: UpdateStoreDto) {
    const store = await this.storeService.update(id, dto);
    return {
      message: 'Cập nhật cửa hàng thành công',
      data: store,
    };
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('approve_store')
  @ApiOperation({ summary: 'Duyệt store (Admin)' })
  async approveStore(@Param('id') id: number) {
    const store = await this.storeService.approveStore(id);
    return {
      message: 'Duyệt cửa hàng thành công',
      data: store,
    };
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('reject_store')
  @ApiOperation({ summary: 'Từ chối store (Admin)' })
  async rejectStore(@Param('id') id: number) {
    const store = await this.storeService.rejectStore(id);
    return {
      message: 'Từ chối cửa hàng thành công',
      data: store,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('delete_store')
  @ApiOperation({ summary: 'Xóa store' })
  async remove(@Param('id') id: number) {
    await this.storeService.remove(id);
    return {
      message: 'Xóa cửa hàng thành công',
    };
  }
}