// libs/backend/src/ghn/ghn.dto.ts
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export interface GHNProvince {
  ProvinceID: number;
  ProvinceName: string;
  Code: string;
}

export interface GHNDistrict {
  DistrictID: number;
  DistrictName: string;
  ProvinceID: number;
}

export interface GHNWard {
  WardCode: string;
  WardName: string;
  DistrictID: number;
}

export class CalculateShippingFeeDto {
  @IsNumber()
  from_district_id!: number; // BẮT BUỘC THÊM

  @IsNumber()
  to_district_id!: number;

  @IsString()
  to_ward_code!: string;

  @IsNumber()
  @Min(100)
  weight!: number;

  @IsOptional() @IsNumber()
  height?: number = 10;

  @IsOptional() @IsNumber()
  width?: number = 15;

  @IsOptional() @IsNumber()
  length?: number = 20;

  @IsOptional() @IsNumber()
  insurance_value?: number = 0;

  @IsOptional() @IsNumber()
  service_type_id?: number;
}
export interface GHNShippingFeeResponse {
  total: number;
  service_fee: number;
  insurance_fee: number;
  pick_station_fee: number;
  coupon_value: number;
  r2s_fee: number;
}
