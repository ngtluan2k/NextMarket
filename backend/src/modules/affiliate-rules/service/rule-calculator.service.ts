// src/calculation-method/calculation-method.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalculateCommissionType } from '../../affiliate-calculation-method/dto/calculate-commission-type.dto';
import {
  CalculationMethod,
  LevelRate,
  PreviewRuleDto,
  PreviewRuleResponseDto,
} from '../dto/PreviewRuleDto.dto';

@Injectable()
export class CalculationMethodService {
  constructor(
    @InjectRepository(CalculateCommissionType)
    private readonly calculateCommissionRepository: Repository<CalculateCommissionType>
  ) {}

  async getAllCalculationMethods(): Promise<CalculateCommissionType[]> {
    return await this.calculateCommissionRepository.find({
      order: {
        created_at: 'DESC',
      },
    });
  }

  calculatePreview(dto: PreviewRuleDto): PreviewRuleResponseDto {
    let levels: LevelRate[];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    switch (dto.method) {
      case CalculationMethod.GEOMETRIC_DECAY:
        levels = this.calculateGeometricDecay(dto);
        this.validateGeometricDecay(dto, levels, warnings, suggestions);
        break;

      case CalculationMethod.FIBONACCI_RATIO:
        levels = this.calculateFibonacci(dto);
        this.validateFibonacci(dto, levels, warnings, suggestions);
        break;

      case CalculationMethod.WEIGHTED_CUSTOM:
        levels = this.calculateWeightedCustom(dto);
        this.validateWeightedCustom(dto, levels, warnings, suggestions);
        break;

      default:
        throw new BadRequestException('Invalid calculation method');
    }

    // Apply rounding
    const roundTo = dto.round_to ?? 2;
    levels = levels.map((l) => ({
      ...l,
      rate: this.roundTo(l.rate, roundTo),
    }));

    // Calculate total and adjust rounding error
    let total = levels.reduce((sum, l) => sum + l.rate, 0);
    total = this.roundTo(total, roundTo);

    // Adjust rounding error to first level
    if (total !== dto.total_budget) {
      const diff = this.roundTo(dto.total_budget - total, roundTo);
      levels[0].rate = this.roundTo(levels[0].rate + diff, roundTo);
      total = dto.total_budget;
    }

    return {
      levels,
      total,
      method: dto.method,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  /**
   * GEOMETRIC DECAY Implementation
   * Formula: F₁ = T × (1 - r) / (1 - r^n)
   *          Fᵢ = F₁ × r^(i-1)
   */
  private calculateGeometricDecay(dto: PreviewRuleDto): LevelRate[] {
    const { total_budget, num_levels, decay_rate } = dto;

    if (!decay_rate) {
      throw new BadRequestException(
        'decay_rate is required for GEOMETRIC_DECAY'
      );
    }

    // Calculate F1
    const numerator = total_budget * (1 - decay_rate);
    const denominator = 1 - Math.pow(decay_rate, num_levels);
    const f1 = numerator / denominator;

    // Calculate all levels
    const levels: LevelRate[] = [];
    for (let i = 0; i < num_levels; i++) {
      const rate = f1 * Math.pow(decay_rate, i);
      levels.push({
        level: i + 1,
        rate,
      });
    }

    return levels;
  }


  private calculateFibonacci(dto: PreviewRuleDto): LevelRate[] {
    const { total_budget, num_levels, starting_index } = dto;

    const fibSequence = this.generateFibonacci(num_levels + 10); 

    const startIdx = starting_index ?? this.getOptimalFibStartIndex(num_levels);

    const weights = fibSequence
      .slice(startIdx, startIdx + num_levels)
      .reverse();

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const levels: LevelRate[] = weights.map((weight, index) => ({
      level: index + 1,
      rate: (total_budget * weight) / totalWeight,
      weight,
    }));

    return levels;
  }


  private generateFibonacci(n: number): number[] {
    const fib = [1, 1];
    for (let i = 2; i < n; i++) {
      fib[i] = fib[i - 1] + fib[i - 2];
    }
    return fib;
  }


  private getOptimalFibStartIndex(numLevels: number): number {
    if (numLevels <= 5) return 3;
    return 5;
  }

  private calculateWeightedCustom(dto: PreviewRuleDto): LevelRate[] {
    const { total_budget, num_levels, weights } = dto;

    if (!weights || weights.length !== num_levels) {
      throw new BadRequestException(
        `weights array must have exactly ${num_levels} elements`
      );
    }

    if (weights.some((w) => w < 0)) {
      throw new BadRequestException('All weights must be non-negative');
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    if (totalWeight === 0) {
      throw new BadRequestException('Total weight cannot be zero');
    }


    const levels: LevelRate[] = weights.map((weight, index) => ({
      level: index + 1,
      rate: (total_budget * weight) / totalWeight,
      weight,
    }));

    return levels;
  }


  private validateGeometricDecay(
    dto: PreviewRuleDto,
    levels: LevelRate[],
    warnings: string[],
    suggestions: string[]
  ): void {
    const { decay_rate, num_levels } = dto;

    if (decay_rate !== undefined && decay_rate < 0.3) {
      const f1Percentage = (levels[0].rate / dto.total_budget) * 100;
      warnings.push(
        `F1 accounts for ${f1Percentage.toFixed(
          1
        )}% of total budget. Consider higher decay rate.`
      );
      suggestions.push('Try decay_rate between 0.5-0.7 for better balance');
    }


    if (decay_rate !== undefined && decay_rate > 0.9) {
      warnings.push(
        'Rates are nearly equal. Consider Flat allocation instead.'
      );
      suggestions.push('For more differentiation, use decay_rate < 0.8');
    }

    const verySmallRates = levels.filter((l) => l.rate < 0.5);
    if (verySmallRates.length > 0) {
      warnings.push(
        `Levels ${verySmallRates
          .map((l) => l.level)
          .join(', ')} have rates < 0.5%`
      );
      suggestions.push('Consider reducing num_levels or increasing budget');
    }
  }


  private validateFibonacci(
    dto: PreviewRuleDto,
    levels: LevelRate[],
    warnings: string[],
    suggestions: string[]
  ): void {
    const { num_levels } = dto;

    if (num_levels === 1) {
      warnings.push('Only 1 level. Consider using multiple levels.');
    }

    if (num_levels > 10) {
      warnings.push('Levels > 10 may result in very small rates');
    }

    // Check for very small rates
    const verySmallRates = levels.filter((l) => l.rate < 0.5);
    if (verySmallRates.length > 0) {
      const optimalLevels = Math.ceil(num_levels * 0.6);
      warnings.push(
        `Levels ${verySmallRates
          .map((l) => l.level)
          .join(', ')} have rates < 0.5%`
      );
      suggestions.push(
        `Optimal levels for ${dto.total_budget}% budget: ${optimalLevels}-${
          optimalLevels + 2
        }`
      );
    }
  }

  /**
   * Validation for Weighted Custom
   */
  private validateWeightedCustom(
    dto: PreviewRuleDto,
    levels: LevelRate[],
    warnings: string[],
    suggestions: string[]
  ): void {
    // Check if one weight is too dominant
    if (dto.weights !== undefined && levels !== undefined) {
      const maxWeight = Math.max(...dto.weights);
      const totalWeight = dto.weights.reduce((sum, w) => sum + w, 0);
      const maxWeightPercentage = (maxWeight / totalWeight) * 100;

      if (maxWeightPercentage > 90) {
        warnings.push(
          `One level accounts for ${maxWeightPercentage.toFixed(
            1
          )}% of budget. Other levels < 10%`
        );
        suggestions.push('Consider balancing weights or using fewer levels');
      }

      // Check if all weights are equal
      const allEqual = dto.weights.every((w) => w === dto.weights[0]);
      if (allEqual) {
        warnings.push('All levels have equal rates');
        suggestions.push('This is equivalent to flat distribution');
      }

      // Check if not in descending order
      const isDescending = dto.weights.every(
        (w, i, arr) => i === 0 || arr[i - 1] >= w
      );
      if (!isDescending) {
        const maxLevel = levels.find(
          (l) => l.rate === Math.max(...levels.map((lv) => lv.rate))
        );
        warnings.push(
          `Rates are not in descending order. F${
            maxLevel.level
          } (${maxLevel.rate.toFixed(2)}%) is highest.`
        );
        suggestions.push('Is this intentional?');
      }

      // Check for zero weights
      const zeroWeights = dto.weights.filter((w) => w === 0);
      if (zeroWeights.length > 0) {
        const disabledLevels = levels
          .filter((l) => l.rate === 0)
          .map((l) => l.level);
        warnings.push(
          `Levels ${disabledLevels.join(', ')} are disabled (rate = 0%)`
        );
      }

      // Check for very small rates
      const verySmallRates = levels.filter((l) => l.rate < 0.5 && l.rate > 0);
      if (verySmallRates.length > 0) {
        warnings.push(
          `Levels ${verySmallRates
            .map((l) => l.level)
            .join(', ')} have rates < 0.5%`
        );
        suggestions.push('Consider adjusting weights or reducing num_levels');
      }
    }
  }

  /**
   * Helper: Round to decimal places
   */
  private roundTo(value: number, decimals: number): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
