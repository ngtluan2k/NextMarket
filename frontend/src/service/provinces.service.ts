// Provinces API Service
const API_BASE = 'http://localhost:3000';

export interface Province {
  code: number;
  name: string;
  name_en: string;
  full_name: string;
  full_name_en: string;
  code_name: string;
}

export interface District {
  code: number;
  name: string;
  name_en: string;
  full_name: string;
  full_name_en: string;
  code_name: string;
  province_code: number;
}

export interface Ward {
  code: number;
  name: string;
  name_en: string;
  full_name: string;
  full_name_en: string;
  code_name: string;
  district_code: number;
}

export class ProvincesService {
  // Lấy danh sách tỉnh/thành phố
  static async getProvinces(version: 'v1' | 'v2' = 'v2'): Promise<Province[]> {
    try {
      const response = await fetch(`${API_BASE}/provinces?version=${version}`);
      if (!response.ok) {
        throw new Error('Failed to fetch provinces');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw error;
    }
  }

  // Lấy danh sách quận/huyện theo tỉnh
  static async getDistricts(provinceCode: number, version: 'v1' | 'v2' = 'v2'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/provinces/${provinceCode}/districts?version=${version}`);
      if (!response.ok) {
        throw new Error('Failed to fetch districts');
      }
      const text = await response.text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        // Not valid JSON → treat as null
        return null;
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      throw error;
    }
  }

  // Lấy danh sách phường/xã theo quận/huyện
  static async getWards(districtCode: number, version: 'v1' | 'v2' = 'v2'): Promise<Ward[]> {
    try {
      const response = await fetch(`${API_BASE}/provinces/districts/${districtCode}/wards?version=${version}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wards');
      }
      const text = await response.text();
      if (!text) return [];
      try {
        return JSON.parse(text);
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
      throw error;
    }
  }
}

export default ProvincesService;
