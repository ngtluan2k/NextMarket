import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OpenApiAddressService {
  private readonly PROVINCE_API_V1_URL = process.env.PROVINCE_API_V1_URL;
  private readonly PROVINCE_API_V2_URL = process.env.PROVINCE_API_V2_URL;

  // Lấy thông tin địa chỉ từ OpenAPI
  async getAddressInfo(provinceName: string, districtName: string, wardName: string) {
    try {
      // 1. Lấy danh sách tỉnh
      const provincesRes = await axios.get(`${this.PROVINCE_API_V1_URL}/provinces`);
      const province = provincesRes.data.find((p: any) => 
        p.name.toLowerCase().includes(provinceName.toLowerCase()) ||
        provinceName.toLowerCase().includes(p.name.toLowerCase())
      );

      if (!province) return null;

      // 2. Lấy danh sách quận/huyện
      const districtsRes = await axios.get(`${this.PROVINCE_API_V1_URL}/provinces/${province.code}/districts`);
      const district = districtsRes.data.find((d: any) => 
        d.name.toLowerCase().includes(districtName.toLowerCase()) ||
        districtName.toLowerCase().includes(d.name.toLowerCase())
      );

      if (!district) return { province };

      // 3. Lấy danh sách phường/xã
      const wardsRes = await axios.get(`${this.PROVINCE_API_V1_URL}/districts/${district.code}/wards`);
      const ward = wardsRes.data.find((w: any) => 
        w.name.toLowerCase().includes(wardName.toLowerCase()) ||
        wardName.toLowerCase().includes(w.name.toLowerCase())
      );

      return {
        province: { code: province.code, name: province.name },
        district: { code: district.code, name: district.name },
        ward: ward ? { code: ward.code, name: ward.name } : null,
      };
    } catch (error) {
      console.error('Lỗi lấy thông tin địa từ OpenAPI:', error);
      return null;
    }
  }
}