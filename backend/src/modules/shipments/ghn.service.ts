import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
    GHNCalculateFeeRequest,
    GHNCalculateFeeResponse,
    GHNProvince,
    GHNDistrict,
    GHNWard,
    GHNServiceResponse,
} from './interfaces/ghn.interface';

@Injectable()
export class GHNService {
    private readonly logger = new Logger(GHNService.name);
    private readonly apiUrl: string;
    private readonly token: string;
    private readonly shopId: string | number;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {
        this.apiUrl = this.configService.get<string>('GHN_API_URL', 'https://dev-online-gateway.ghn.vn/shiip/public-api');
        this.token = this.configService.get<string>('GHN_API_TOKEN', '');
        this.shopId = this.configService.get<string | number>('GHN_SHOP_ID', '');

        if (!this.token) {
            this.logger.warn('GHN_API_TOKEN is not configured');
        }
        if (!this.shopId) {
            this.logger.warn('GHN_SHOP_ID is not configured');
        }
    }

    private getHeaders(includeShopId: boolean = true) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Token': this.token,
        };

        if (includeShopId) {
            headers['ShopId'] = this.shopId.toString();
        }

        return headers;
    }

    private handleError(error: any, context: string): never {
        this.logger.error(`GHN API Error in ${context}: ${error.message}`, error.stack);

        if (error.response?.data) {
            const ghnError = error.response.data;
            throw new HttpException(
                {
                    message: ghnError.message || `GHN API error in ${context}`,
                    code: ghnError.code,
                    data: ghnError.data,
                },
                error.response.status || HttpStatus.BAD_REQUEST,
            );
        }

        if (error.request) {
            throw new HttpException(
                `Failed to connect to GHN API: ${context}`,
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        throw new HttpException(
            `Internal error in ${context}: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }

    async calculateFee(data: GHNCalculateFeeRequest): Promise<GHNCalculateFeeResponse['data']> {
        try {
            this.logger.log(`Calculating shipping fee: ${JSON.stringify(data)}`);

            const response = await firstValueFrom(
                this.httpService.post<GHNCalculateFeeResponse>(
                    `${this.apiUrl}/v2/shipping-order/fee`,
                    {
                        service_type_id: data.service_type_id || 2,
                        from_district_id: data.from_district_id,
                        to_district_id: data.to_district_id,
                        weight: data.weight || 1000,
                        length: data.length || 20,
                        width: data.width || 15,
                        height: data.height || 10,
                        insurance_value: data.insurance_value || 500000,
                        coupon: data.coupon || null,
                    },
                    { headers: this.getHeaders() },
                ),
            );

            if (response.data.code !== 200) {
                throw new HttpException(
                    {
                        message: response.data.message || 'Failed to calculate shipping fee',
                        code: response.data.code,
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            this.logger.log(`Shipping fee calculated: ${response.data.data.total} VND`);
            return response.data.data;
        } catch (error) {
            this.handleError(error, 'calculateFee');
        }
    }

    async getProvinces(): Promise<GHNProvince[]> {
        try {
            this.logger.log('Fetching provinces from GHN');

            const response = await firstValueFrom(
                this.httpService.get<{ code: number; message: string; data: GHNProvince[] }>(
                    `${this.apiUrl}/master-data/province`,
                    { headers: this.getHeaders(false) },
                ),
            );

            if (response.data.code !== 200) {
                throw new HttpException(
                    response.data.message || 'Failed to fetch provinces',
                    HttpStatus.BAD_REQUEST,
                );
            }

            this.logger.log(`Fetched ${response.data.data?.length || 0} provinces`);
            return response.data.data || [];
        } catch (error) {
            this.handleError(error, 'getProvinces');
        }
    }

    async getDistricts(provinceId: number): Promise<GHNDistrict[]> {
        try {
            this.logger.log(`Fetching districts for provinceId: ${provinceId}`);

            const response = await firstValueFrom(
                this.httpService.post<{ code: number; message: string; data: GHNDistrict[] }>(
                    `${this.apiUrl}/master-data/district`,
                    { province_id: provinceId },
                    { headers: this.getHeaders(false) },
                ),
            );

            if (response.data.code !== 200) {
                throw new HttpException(
                    response.data.message || 'Failed to fetch districts',
                    HttpStatus.BAD_REQUEST,
                );
            }

            this.logger.log(`Fetched ${response.data.data?.length || 0} districts`);
            return response.data.data || [];
        } catch (error) {
            this.handleError(error, 'getDistricts');
        }
    }

    async getWards(districtId: number): Promise<GHNWard[]> {
        try {
            this.logger.log(`Fetching wards for districtId: ${districtId}`);

            const response = await firstValueFrom(
                this.httpService.post<{ code: number; message: string; data: GHNWard[] }>(
                    `${this.apiUrl}/master-data/ward`,
                    { district_id: districtId },
                    { headers: this.getHeaders(false) },
                ),
            );

            if (response.data.code !== 200) {
                throw new HttpException(
                    response.data.message || 'Failed to fetch wards',
                    HttpStatus.BAD_REQUEST,
                );
            }

            this.logger.log(`Fetched ${response.data.data?.length || 0} wards`);
            return response.data.data || [];
        } catch (error) {
            this.handleError(error, 'getWards');
        }
    }

    async getServices(toDistrictId: number): Promise<any[]> {
        try {
            this.logger.log(`Fetching available services for district: ${toDistrictId}`);

            // Mặc định lấy từ district Hà Nội (Cầu Giấy) - có thể config sau
            const fromDistrictId = this.configService.get<number>('GHN_FROM_DISTRICT_ID', 1444);

            const response = await firstValueFrom(
                this.httpService.post<{ code: number; message: string; data: any[] }>(
                    `${this.apiUrl}/v2/shipping-order/available-services`,
                    {
                        shop_id: parseInt(this.shopId.toString()),
                        from_district: fromDistrictId,
                        to_district: toDistrictId,
                    },
                    { headers: this.getHeaders() },
                ),
            );

            if (response.data.code !== 200) {
                throw new HttpException(
                    response.data.message || 'Failed to fetch services',
                    HttpStatus.BAD_REQUEST,
                );
            }

            this.logger.log(`Fetched ${response.data.data?.length || 0} services`);
            return response.data.data || [];
        } catch (error) {
            this.handleError(error, 'getServices');
        }
    }

    async validateAddress(
        provinceId: number,
        districtId: number,
        wardCode?: string
    ): Promise<boolean> {
        try {
            const districts = await this.getDistricts(provinceId);
            const districtExists = districts.some(d => d.DistrictID === districtId);

            if (!districtExists) {
                return false;
            }

            if (wardCode) {
                const wards = await this.getWards(districtId);
                const wardExists = wards.some(w => w.WardCode === wardCode);
                return wardExists;
            }

            return true;
        } catch (error) {
            if (error instanceof Error) {
                this.logger.warn(`Address validation failed: ${error.message}`);
            } else {
                this.logger.warn(`Address validation failed: ${String(error)}`);
            }
            return false;
        }
    }


    async getServiceTypes(): Promise<any[]> {
        try {
            this.logger.log('Fetching service types');

            const response = await firstValueFrom(
                this.httpService.get<{ code: number; message: string; data: any[] }>(
                    `${this.apiUrl}/v2/shipping-order/service-types`,
                    { headers: this.getHeaders() },
                ),
            );

            if (response.data.code !== 200) {
                throw new HttpException(
                    response.data.message || 'Failed to fetch service types',
                    HttpStatus.BAD_REQUEST,
                );
            }

            return response.data.data || [];
        } catch (error) {
            this.handleError(error, 'getServiceTypes');
        }
    }
}