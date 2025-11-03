import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  ParseIntPipe,
  Param,
  Patch,
} from '@nestjs/common';
import { FlashSaleSchedulesService } from './flash_sale_schedules.service';
import { CreateFlashSaleScheduleDto } from './dto/create-flash_sale_schedule.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RegisterFlashSaleDto } from './dto/register-flash_sale.dto';
import { UpdateFlashSaleScheduleDto } from './dto/update-flash_sale_schedule.dto';

@Controller('flash-sale-schedules')
export class FlashSaleSchedulesController {
  constructor(private readonly scheduleService: FlashSaleSchedulesService) {}

  ////////////////////////////ADMIN////////////////////

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateFlashSaleScheduleDto, @Req() req: any) {
    if (!req.user.roles?.includes('Admin')) {
      throw new ForbiddenException('Chỉ admin mới tạo campaign');
    }
    return this.scheduleService.create(dto);
  }

  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') scheduleId: number,
    @Body() dto: UpdateFlashSaleScheduleDto,
    @Req() req: any
  ) {
    if (!req.user.roles.includes('Admin')) {
      throw new ForbiddenException('Chỉ admin mới được update flash sale');
    }
    return this.scheduleService.updateSchedule(scheduleId, dto);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  async findAllForAdmin(@Req() req: any) {
    if (!req.user.roles?.includes('Admin')) {
      throw new ForbiddenException('Chỉ admin mới tạo campaign');
    }
    return this.scheduleService.findAllForAdmin(req.user);
  }

  @Get('/:id/registered-products/admin')
  @UseGuards(JwtAuthGuard)
  async getRegisteredProductsForAdmin(
    @Param('id') scheduleId: number,
    @Req() req: any
  ) {
    if (!req.user.roles.includes('Admin')) {
      throw new ForbiddenException(
        'Chỉ admin mới xem được chi tiết flash sale'
      );
    }
    return this.scheduleService.getRegisteredProductsForAdmin(scheduleId);
  }

  ////////////////////////////STORE////////////////////

  // 🧱 3️⃣ Lấy danh sách flash sale (store)
  @Get('store')
  async findAllForStore(@Req() req: any) {
    return this.scheduleService.findAllForStore(req.user);
  }

  @Post('store/register')
  @UseGuards(JwtAuthGuard)
  async register(@Req() req: any, @Body() dto: RegisterFlashSaleDto) {
    const storeId = req.user.store_id; // từ JWT payload
    return this.scheduleService.registerStoreFlashSale(storeId, dto);
  }

  @Get(':scheduleId/registered-products')
  @UseGuards(JwtAuthGuard)
  async getRegisteredProducts(
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Req() req: any
  ) {
    return this.scheduleService.getRegisteredProductsForStore(
      scheduleId,
      req.user.storeId
    );
  }

  @Patch(':scheduleId/register')
  @UseGuards(JwtAuthGuard)
  async updateStoreFlashSaleRegistration(
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Body() dto: RegisterFlashSaleDto,
    @Req() req: any
  ) {
    const storeId = req.user.store_id; // lấy từ JWT
    return this.scheduleService.updateStoreFlashSaleRegistration(
      scheduleId,
      storeId,
      dto
    );
  }
}
