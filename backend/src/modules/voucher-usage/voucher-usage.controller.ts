import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { VoucherUsageService } from './voucher-usage.service';
import { CreateVoucherUsageDto } from './dto/create-voucher-usage.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('voucher-usage')
@ApiBearerAuth()
@Controller('voucher-usage')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VoucherUsageController {
  constructor(private readonly usageService: VoucherUsageService) {}

  // Chỉ admin được phép gọi endpoint này
  @Post()
  @Permissions('add_voucher_usage')
  @ApiOperation({ summary: 'Tạo bản ghi sử dụng voucher (chỉ admin)' })
  @ApiResponse({
    status: 201,
    description: 'Bản ghi sử dụng voucher được tạo thành công',
  })
  create(@Body() dto: CreateVoucherUsageDto, @Req() req: any) {
    const userId = req.user?.sub;
    const role = req.user?.roles;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.usageService.create(dto);
  }

  @Get()
  @Permissions('view_voucher_usage')
  @ApiOperation({ summary: 'Lấy danh sách bản ghi sử dụng voucher' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bản ghi sử dụng voucher',
  })
  findAll(@Req() req: any) {
    const userId = req.user?.sub;
    const role = req.user?.roles;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.usageService.findAll(userId, role);
  }

  @Get(':id')
  @Permissions('view_voucher_usage')
  @ApiOperation({ summary: 'Lấy chi tiết bản ghi sử dụng voucher' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin bản ghi sử dụng voucher',
  })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req.user?.sub;
    const role = req.user?.roles;
    if (!userId) {
      throw new Error('Người dùng chưa được xác thực');
    }
    return this.usageService.findOne(id, userId, role);
  }
}
