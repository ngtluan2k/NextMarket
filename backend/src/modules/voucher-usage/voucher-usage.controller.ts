import { Controller, Get, Post, Body } from '@nestjs/common';
import { VoucherUsageService } from './voucher-usage.service';
import { CreateVoucherUsageDto } from './dto/create-voucher-usage.dto';

@Controller('voucher-usage')
export class VoucherUsageController {
  constructor(private readonly usageService: VoucherUsageService) {}

  @Post()
  create(@Body() dto: CreateVoucherUsageDto) {
    return this.usageService.create(dto);
  }

  @Get()
  findAll() {
    return this.usageService.findAll();
  }
}
