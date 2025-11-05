// src/calculation-method/calculation-method.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalculateCommissionType } from '../dto/calculate-commission-type.dto';

@Injectable()
export class CalculationMethodService {
  constructor(
    @InjectRepository(CalculateCommissionType)
    private readonly calculateCommissionRepository: Repository<CalculateCommissionType>,
  ) {}

  async getAllCalculationMethods(): Promise<CalculateCommissionType[]> {
    return await this.calculateCommissionRepository.find({
      order: {
        created_at: 'DESC'
      }
    });
  }



}