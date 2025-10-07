import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProvincesService } from './provinces.service';

@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Get()
  async getProvinces(@Query('version') version: 'v1' | 'v2' = 'v1') {
    return this.provincesService.getProvinces(version);
  }

  @Get(':provinceCode/districts')
  async getDistricts(
    @Param('provinceCode', ParseIntPipe) provinceCode: number,
    @Query('version') version: 'v1' | 'v2' = 'v1'
  ) {
    return this.provincesService.getDistricts(provinceCode, version);
  }

  @Get('districts/:districtCode/wards')
  async getWards(
    @Param('districtCode', ParseIntPipe) districtCode: number,
    @Query('version') version: 'v1' | 'v2' = 'v1'
  ) {
    return this.provincesService.getWards(districtCode, version);
  }
}
