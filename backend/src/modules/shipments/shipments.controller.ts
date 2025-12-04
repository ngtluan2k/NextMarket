import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import {
  CalculateShippingDto,
  GetDistrictsDto,
  GetWardsDto,
} from './dto/calculate-shipping.dto';

@ApiTags('shipments')
@Controller('shipments')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post('calculate-fee')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tính phí vận chuyển GHN' })
  @ApiResponse({ status: 200, description: 'Phí vận chuyển đã được tính' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async calculateFee(@Body() calculateShippingDto: CalculateShippingDto) {
    return this.shipmentsService.calculateShippingFee(calculateShippingDto);
  }

  @Get('provinces')
  @ApiOperation({ summary: 'Lấy danh sách tỉnh/thành từ GHN' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getProvinces() {
    return this.shipmentsService.getProvinces();
  }

  @Post('districts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách quận/huyện theo tỉnh' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 400, description: 'Thiếu province_id' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDistricts(@Body() getDistrictsDto: GetDistrictsDto) {
    return this.shipmentsService.getDistricts(getDistrictsDto);
  }

  @Post('wards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách phường/xã theo quận' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 400, description: 'Thiếu district_id' })
  async getWards(@Body() getWardsDto: GetWardsDto) {
    return this.shipmentsService.getWards(getWardsDto);
  }

  @Get('services/:districtId')
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ có sẵn' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 400, description: 'District ID không hợp lệ' })
  async getServices(@Param('districtId', ParseIntPipe) districtId: number) {
    return this.shipmentsService.getServices(districtId);
  }

  @Get('service-types')
  @ApiOperation({ summary: 'Lấy danh sách loại dịch vụ' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getServiceTypes() {
    return this.shipmentsService.getServiceTypes();
  }

  @Get('validate-address')
  @ApiOperation({ summary: 'Kiểm tra địa chỉ có hợp lệ không' })
  @ApiQuery({ name: 'provinceId', required: true, type: Number })
  @ApiQuery({ name: 'districtId', required: true, type: Number })
  @ApiQuery({ name: 'wardCode', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async validateAddress(
    @Query('provinceId', ParseIntPipe) provinceId: number,
    @Query('districtId', ParseIntPipe) districtId: number,
    @Query('wardCode') wardCode?: string,
  ) {
    return this.shipmentsService.validateAddress(provinceId, districtId, wardCode);
  }
}