export interface GHNCalculateFeeRequest {
  service_type_id: number;
  from_district_id: number;
  to_district_id: number;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  insurance_value?: number;
  coupon?: string | null;
}

export interface GHNCalculateFeeResponse {
  code: number;
  message: string;
  data: {
    total: number;
    service_fee: number;
    insurance_fee: number;
    pick_station_fee: number;
    coupon_value: number;
    r2s_fee: number;
    return_again: number;
    document_return: number;
    double_check: number;
    cod_fee: number;
    pick_remote_areas_fee: number;
    deliver_remote_areas_fee: number;
    cod_failed_fee: number;
    total_without_cod_failed_fee: number;
    expected_delivery_time: string;
  };
}

export interface GHNServiceResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface GHNProvince {
  ProvinceID: number;
  ProvinceName: string;
  CountryID: number;
  Code: string;
  NameExtension: string[];
  IsEnable: number;
  RegionID: number;
  RegionCPN: number;
  UpdatedBy: number;
  CreatedAt: string;
  UpdatedAt: string;
  CanUpdateCOD: boolean;
  Status: number;
}

export interface GHNDistrict {
  DistrictID: number;
  DistrictName: string;
  ProvinceID: number;
  ProvinceName?: string;
  CountryID?: number;
  SupportType?: number;
  NameExtension?: string[];
  CanUpdateCOD?: boolean;
  Status?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  UpdatedBy?: number;
}

export interface GHNWard {
  WardCode: string;
  DistrictID: number;
  WardName: string;
  NameExtension?: string[];
  CanUpdateCOD?: boolean;
  SupportType?: number;
  Status?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  UpdatedBy?: number;
}

export interface GHNServiceType {
  service_type_id: number;
  name: string;
  description?: string;
}