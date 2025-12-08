// libs/backend/src/ghn/ghn.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  GHNProvince,
  GHNDistrict,
  GHNWard,
  CalculateShippingFeeDto,
  GHNShippingFeeResponse,
} from './ghn.dto';

@Injectable()
export class GhnService {
  private readonly client: AxiosInstance;
  private readonly token: string;
  private readonly shopId: number;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('GHN_TOKEN');
    const shopIdStr = this.configService.get<string>('GHN_SHOP_ID');

    if (!token || !shopIdStr) {
      throw new Error('GHN_TOKEN hoặc GHN_SHOP_ID chưa được cấu hình trong .env');
    }

    this.token = token.trim();
    this.shopId = Number(shopIdStr.trim());

    const baseURL = this.configService.get<string>('GHN_API_URL')
      ?? 'https://online-gateway.ghn.vn/shiip/public-api';

    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Token': this.token,        // giờ là string 100%
        'ShopId': this.shopId.toString(),
      },
    });
  }
  /**
   * Lấy danh sách tỉnh/thành phố
   */
  async getProvinces(): Promise<GHNProvince[]> {
    try {
      const response = await this.client.get('/master-data/province');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ GHN getProvinces error:', error.response?.data || error.message);
      throw new HttpException(
        'Không thể lấy danh sách tỉnh/thành phố',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Lấy danh sách quận/huyện theo tỉnh
   */
  async getDistricts(provinceId: number): Promise<GHNDistrict[]> {
    try {
      const response = await this.client.post('/master-data/district', {
        province_id: provinceId,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('❌ GHN getDistricts error:', error.response?.data || error.message);
      throw new HttpException(
        'Không thể lấy danh sách quận/huyện',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Lấy danh sách phường/xã theo quận
   */
  async getWards(districtId: number): Promise<GHNWard[]> {
    try {
      const response = await this.client.post('/master-data/ward', {
        district_id: districtId,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('❌ GHN getWards error:', error.response?.data || error.message);
      throw new HttpException(
        'Không thể lấy danh sách phường/xã',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Tính phí ship
   */
  async calculateShippingFee(dto: CalculateShippingFeeDto) {
    const payload = {
      shop_id: this.shopId,
      from_district_id: dto.from_district_id,     // THÊM
      to_district_id: dto.to_district_id,
      to_ward_code: dto.to_ward_code,
      service_type_id: dto.service_type_id ?? 2,
      insurance_value: dto.insurance_value ?? 0,
      weight: dto.weight,
      height: dto.height ?? 10,
      width: dto.width ?? 15,
      length: dto.length ?? 20,
    };

    const response = await this.client.post('/v2/shipping-order/fee', payload);
    return response.data.data; // { total: 32000, service_fee: ... }
  }

  /**
   * Lấy danh sách dịch vụ có sẵn
   */
  async getAvailableServices(
    fromDistrictId: number,
    toDistrictId: number
  ): Promise<any[]> {
    try {
      const response = await this.client.post('/v2/shipping-order/available-services', {
        shop_id: this.shopId,
        from_district: fromDistrictId,
        to_district: toDistrictId,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('❌ GHN getAvailableServices error:', error.response?.data || error.message);
      throw new HttpException(
        'Không thể lấy danh sách dịch vụ',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Tạo đơn hàng GHN
   */
  async createOrder(orderData: any): Promise<any> {
    try {
      const payload = {
        ...orderData,
        shop_id: this.shopId,
      };

      const response = await this.client.post('/v2/shipping-order/create', payload);

      if (response.data.code !== 200) {
        throw new Error(response.data.message || 'Tạo đơn GHN thất bại');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Tạo đơn GHN lỗi:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.message || 'Không thể tạo đơn GHN',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Hủy đơn hàng GHN
   */
  async cancelOrder(orderCodes: string[]): Promise<any> {
    try {
      const response = await this.client.post('/v2/switch-status/cancel', {
        shop_id: this.shopId,
        order_codes: orderCodes,
      });
      return response.data.data;
    } catch (error: any) {
      console.error('❌ GHN cancelOrder error:', error.response?.data || error.message);
      throw new HttpException(
        'Không thể hủy đơn hàng GHN',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}