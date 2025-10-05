import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ProvincesService {
  private readonly API_V1: string;
  private readonly API_V2: string;

  constructor(private readonly configService: ConfigService) {
    const apiV1 = this.configService.get<string>('PROVINCE_API_V1_URL')?.trim();
    const apiV2 = this.configService.get<string>('PROVINCE_API_V2_URL')?.trim();
    console.log('ENV URL:', process.env.PROVINCE_API_V1_URL);

    if (!apiV1) throw new Error('PROVINCE_API_V1_URL is missing in .env');
    if (!apiV2) throw new Error('PROVINCE_API_V2_URL is missing in .env');

    this.API_V1 = apiV1;
    this.API_V2 = apiV2;
  }

  private getApiBase(version: 'v1' | 'v2' = 'v1') {
    return version === 'v2' ? this.API_V2 : this.API_V1;
  }

  async getProvinces(version: 'v1' | 'v2' = 'v1') {
    try {
      const apiBase = this.getApiBase(version);
      const res = await axios.get(`${apiBase}/p`);
      return res.data ?? [];
    } catch (err: any) {
      console.error('❌ Error fetching provinces:', err.message);
      return [];
    }
  }

  async getDistricts(provinceCode: number, version: 'v1' | 'v2' = 'v1') {
    try {
      const apiBase = this.getApiBase(version);
      const url = `${apiBase}/p/${provinceCode}?depth=2`;
      console.log('📡 Fetching district/ward data from:', url);

      const res = await axios.get(url);

      // Kiểm tra dữ liệu trả về
      if (!res.data || typeof res.data !== 'object') {
        console.warn('⚠️ No valid data returned');
        return version === 'v1' ? [] : [];
      }

      if (version === 'v1') {
        return Array.isArray(res.data.districts) ? res.data.districts : [];
      }

      // v2: chỉ cần danh sách phường/xã theo tỉnh
      // Một số API có thể:
      // - trả trực tiếp wards: []
      // - hoặc trả districts: [{ wards: [] }]
      const wardsDirect = Array.isArray((res.data as any).wards)
        ? (res.data as any).wards
        : null;
      if (wardsDirect) return wardsDirect;

      const districts = Array.isArray((res.data as any).districts)
        ? (res.data as any).districts
        : [];
      const wardsFromDistricts = districts.flatMap((d: any) =>
        Array.isArray(d?.wards) ? d.wards : []
      );
      return wardsFromDistricts;
    } catch (err: any) {
      console.error('❌ Error fetching districts:', err.message);
      return version === 'v1' ? [] : [];
    }
  }

  async getWards(districtCode: number, version: 'v1' | 'v2' = 'v1') {
    try {
      if (version === 'v2') {
        console.warn(
          '⚠️ v2 API does not support fetching wards by districtCode'
        );
        return [];
      }

      const apiBase = this.getApiBase(version);
      const res = await axios.get(`${apiBase}/d/${districtCode}?depth=2`);
      return res.data?.wards ?? [];
    } catch (err: any) {
      console.error('❌ Error fetching wards:', err.message);
      return [];
    }
  }
}
