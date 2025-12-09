// services/ghn-mapping.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
@Injectable()
export class GhnMappingService {
  private readonly GHN_TOKEN = process.env.GHN_TOKEN; // b1d7d8b3-d0d8-11f0-b1ee-0e8b75c4b315
  private readonly GHN_SHOP_ID = process.env.GHN_SHOP_ID; // 6148140
  private readonly BASE_URL = 'https://online-gateway.ghn.vn/shiip/public-api'; // production

  // Cache trong Redis hoặc memory ít nhất 30 ngày
  private provinceCache = new Map<string, number>();
  private districtCache = new Map<string, number>();
  private wardCache = new Map<string, string>();

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async mapToGHNIds(
    provinceName: string,
    districtName: string,
    wardName?: string,
  ): Promise<{
    ghn_province_id?: number;
    ghn_district_id?: number;
    ghn_ward_code?: string;
  }> {
    try {
      const provinceId = await this.findProvinceId(provinceName);
      if (!provinceId) return {};

      const districtId = await this.findDistrictId(districtName, provinceId);
      if (!districtId) return { ghn_province_id: provinceId };

      const wardCode = wardName
        ? await this.findWardCode(wardName, districtId)
        : undefined;

      return {
        ghn_province_id: provinceId,
        ghn_district_id: districtId,
        ghn_ward_code: wardCode,
      };
    } catch (error) {
      console.error('Lỗi map GHN:', error);
      return {};
    }
  }

  private async findProvinceId(provinceName: string): Promise<number | undefined> {
    const cacheKey = `ghn_province:${this.normalize(provinceName)}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached) return cached;

    const res = await axios.get(`${this.BASE_URL}/master-data/province`, {
      headers: { Token: this.GHN_TOKEN },
    });

    const found = res.data.data.find((p: any) =>
      this.normalize(p.ProvinceName).includes(this.normalize(provinceName)) ||
      this.normalize(provinceName).includes(this.normalize(p.ProvinceName))
    );

    if (found) {
      await this.cacheManager.set(cacheKey, found.ProvinceID, 30 * 24 * 3600); // 30 ngày
      return found.ProvinceID;
    }
    return undefined;
  }

  private async findDistrictId(districtName: string, provinceId: number): Promise<number | undefined> {
    const cacheKey = `ghn_district:${provinceId}:${this.normalize(districtName)}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached) return cached;

    const res = await axios.get(`${this.BASE_URL}/master-data/district`, {
      params: { province_id: provinceId },
      headers: { Token: this.GHN_TOKEN },
    });

    const found = res.data.data.find((d: any) =>
      this.normalize(d.DistrictName).includes(this.normalize(districtName)) ||
      this.normalize(districtName).includes(this.normalize(d.DistrictName))
    );

    if (found) {
      await this.cacheManager.set(cacheKey, found.DistrictID, 30 * 24 * 3600);
      return found.DistrictID;
    }
    return undefined;
  }

  private async findWardCode(wardName: string, districtId: number): Promise<string | undefined> {
    const cacheKey = `ghn_ward:${districtId}:${this.normalize(wardName)}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) return cached;

    const res = await axios.get(`${this.BASE_URL}/master-data/ward`, {
      params: { district_id: districtId },
      headers: { Token: this.GHN_TOKEN },
    });

    const found = res.data.data.find((w: any) =>
      this.normalize(w.WardName).includes(this.normalize(wardName)) ||
      this.normalize(wardName).includes(this.normalize(w.WardName))
    );

    if (found) {
      await this.cacheManager.set(cacheKey, found.WardCode, 30 * 24 * 3600);
      return found.WardCode;
    }
    return undefined;
  }

  private normalize(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}