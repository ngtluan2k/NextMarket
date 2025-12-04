import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { GHNService } from './ghn.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { GetDistrictsDto } from './dto/calculate-shipping.dto';
import { GetWardsDto } from './dto/calculate-shipping.dto';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(private readonly ghnService: GHNService) {}

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private getErrorStack(error: unknown): string | undefined {
    return error instanceof Error ? error.stack : undefined;
  }

  async calculateShippingFee(calculateShippingDto: CalculateShippingDto) {
    this.logger.log(`Calculating shipping fee: ${JSON.stringify(calculateShippingDto)}`);

    try {
      const result = await this.ghnService.calculateFee({
        service_type_id: calculateShippingDto.service_type_id,
        from_district_id: calculateShippingDto.from_district_id,
        to_district_id: calculateShippingDto.to_district_id,
        weight: calculateShippingDto.weight,
        length: calculateShippingDto.length,
        width: calculateShippingDto.width,
        height: calculateShippingDto.height,
        insurance_value: calculateShippingDto.insurance_value,
      });

      return {
        success: true,
        data: result,
        message: 'Shipping fee calculated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate shipping fee: ${this.getErrorMessage(error)}`,
        this.getErrorStack(error),
      );
      throw error;
    }
  }

  async getProvinces() {
    this.logger.log('Getting provinces');

    try {
      const provinces = await this.ghnService.getProvinces();

      return {
        success: true,
        data: provinces,
        message: 'Provinces fetched successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get provinces: ${this.getErrorMessage(error)}`,
        this.getErrorStack(error),
      );
      throw error;
    }
  }

  async getDistricts(getDistrictsDto: GetDistrictsDto) {
    this.logger.log(`Getting districts for province: ${getDistrictsDto.province_id}`);

    try {
      const districts = await this.ghnService.getDistricts(getDistrictsDto.province_id);

      return {
        success: true,
        data: districts,
        message: 'Districts fetched successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get districts: ${this.getErrorMessage(error)}`,
        this.getErrorStack(error),
      );
      throw error;
    }
  }

  async getWards(getWardsDto: GetWardsDto) {
    this.logger.log(`Getting wards for district: ${getWardsDto.district_id}`);

    try {
      const wards = await this.ghnService.getWards(getWardsDto.district_id);

      return {
        success: true,
        data: wards,
        message: 'Wards fetched successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get wards: ${this.getErrorMessage(error)}`,
        this.getErrorStack(error),
      );
      throw error;
    }
  }

  async getServices(districtId: number) {
    this.logger.log(`Getting services for district: ${districtId}`);

    try {
      const services = await this.ghnService.getServices(districtId);

      return {
        success: true,
        data: services,
        message: 'Services fetched successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get services: ${this.getErrorMessage(error)}`,
        this.getErrorStack(error),
      );
      throw error;
    }
  }

  async getServiceTypes() {
    this.logger.log('Getting service types');

    try {
      const serviceTypes = await this.ghnService.getServiceTypes();

      return {
        success: true,
        data: serviceTypes,
        message: 'Service types fetched successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get service types: ${this.getErrorMessage(error)}`,
        this.getErrorStack(error),
      );
      throw error;
    }
  }

  async validateAddress(provinceId: number, districtId: number, wardCode?: string) {
    this.logger.log(`Validating address: province=${provinceId}, district=${districtId}, ward=${wardCode}`);

    try {
      const isValid = await this.ghnService.validateAddress(provinceId, districtId, wardCode);

      return {
        success: true,
        data: { isValid },
        message: isValid ? 'Address is valid' : 'Address is invalid',
      };
    } catch (error) {
      this.logger.error(
        `Failed to validate address: ${this.getErrorMessage(error)}`,
        this.getErrorStack(error),
      );
      throw error;
    }
  }
}
