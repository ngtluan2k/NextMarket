// libs/backend/src/ghn/ghn.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { GhnService } from './ghn.service';
import { CalculateShippingFeeDto } from './ghn.dto';


@Controller('ghn')
export class GhnController {
  constructor(private readonly ghnService: GhnService) {}

  /**
   * GET /ghn/provinces
   * Lấy danh sách tỉnh/thành phố
   */
  @Get('provinces')
  async getProvinces() {
    return this.ghnService.getProvinces();
  }

  /**
   * GET /ghn/districts?province_id=202
   * Lấy danh sách quận/huyện
   */
  @Get('districts')
  async getDistricts(@Query('province_id') provinceId: string) {
    return this.ghnService.getDistricts(Number(provinceId));
  }

  /**
   * GET /ghn/wards?district_id=1442
   * Lấy danh sách phường/xã
   */
  @Get('wards')
  async getWards(@Query('district_id') districtId: string) {
    return this.ghnService.getWards(Number(districtId));
  }

  /**
   * POST /ghn/calculate-fee
   * Tính phí ship
   */
  @Post('calculate-fee')
  async calculateShippingFee(@Body() dto: CalculateShippingFeeDto) {
    return this.ghnService.calculateShippingFee(dto);
  }

  /**
   * GET /ghn/services?from_district=1442&to_district=1443
   * Lấy danh sách dịch vụ có sẵn
   */
  @Get('services')
  async getAvailableServices(
    @Query('from_district') fromDistrict: string,
    @Query('to_district') toDistrict: string
  ) {
    return this.ghnService.getAvailableServices(
      Number(fromDistrict),
      Number(toDistrict)
    );
  }
}