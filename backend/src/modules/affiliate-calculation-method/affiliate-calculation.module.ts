import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculationMethodController } from './controller/calculateMethod.controller';
import { CalculationMethodService } from '../affiliate-rules/service/rule-calculator.service';
import { CalculateCommissionType } from './dto/calculate-commission-type.dto';

@Module({
  imports: [TypeOrmModule.forFeature([CalculateCommissionType])],
  controllers: [CalculationMethodController],
  providers: [CalculationMethodService],
  exports: [CalculationMethodService],
})
export class CalculationMethodModule {}
