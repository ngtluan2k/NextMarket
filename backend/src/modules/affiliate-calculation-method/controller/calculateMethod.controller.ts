// src/calculation-method/calculation-method.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CalculationMethodService } from '../../affiliate-rules/service/rule-calculator.service';
import { Roles } from '../../../common/auth/roles.decorator';

@Controller('calculation-method')
export class CalculationMethodController {
  constructor(private readonly calculationMethodService: CalculationMethodService) {}

  @Get()
  @Roles('Admin')
  async getAllCalculationMethods() {
    return this.calculationMethodService.getAllCalculationMethods();
  }
}