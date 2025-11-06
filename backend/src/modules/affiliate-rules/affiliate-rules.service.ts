import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRuleDto } from './dto/create-commission-rule.dto';
// import { UpdateCommissionRuleDto } from './dto/update-commission-rule.dto';
// import { PreviewCommissionDto } from './dto/preview-commission.dto';
import { AffiliateCommissionRule } from './affiliate-rules.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';
import { CalculationMethodService } from './service/rule-calculator.service';
@Injectable()
export class AffiliateRulesService {
  constructor(
    @InjectRepository(AffiliateCommissionRule)
    private readonly repo: Repository<AffiliateCommissionRule>,
    @InjectRepository(AffiliateProgram)
    private readonly programRepo: Repository<AffiliateProgram>,
    private readonly calculatorService: CalculationMethodService
  ) {}

  async create(createRuleDTO: CreateRuleDto): Promise<AffiliateCommissionRule> {
    const previewDto = this.mapToPreviewDto(createRuleDTO);
    const previewResult = this.calculatorService.calculatePreview(previewDto);

    if (previewResult.warnings && previewResult.warnings.length > 0) {
      console.warn('Rule created with warning: ', previewResult.warnings);
    }

    const rule = this.repo.create({
      ...createRuleDTO,
      calculated_rates: previewResult.levels, // Lưu kết quả đã tính
      is_active: true,
    });

    return await this.repo.save(rule);
  }
  async findAll(): Promise<AffiliateCommissionRule[]> {
    return await this.repo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find one rule by ID
   */
  async findOne(id: string): Promise<AffiliateCommissionRule> {
    const rule = await this.repo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }
    return rule;
  }


  private mapToPreviewDto(dto: any) {
    return {
      total_budget: dto.total_budget,
      num_levels: dto.num_levels,
      method: dto.calculation_method,
      decay_rate: dto.decay_rate,
      starting_index: dto.starting_index,
      weights: dto.weights,
      round_to: 2, // Default precision
    };
  }


  // async create(dto: CreateRuleDto) {
  //   console.log('Creating commission rule with DTO:', dto);

  //   // Validate program_id if provided
  //   if (dto.program_id !== null && dto.program_id !== undefined) {
  //     console.log(`Checking program status for ID: ${dto.program_id}`);
  //     const program = await this.programRepo.findOne({ where: { id: dto.program_id } });
  //     console.log('Found program:', program);

  //     if (!program) {
  //       throw new NotFoundException(`Affiliate program with ID ${dto.program_id} not found`);
  //     }

  //     console.log(`Program status: ${program.status}`);
  //     if (program.status !== 'active') {
  //       throw new BadRequestException(`Cannot create commission rule for inactive affiliate program "${program.name}" (Status: ${program.status})`);
  //     }
  //   } else {
  //     console.log('Creating rule for default program (program_id is null)');
  //   }

  //   const entity = new AffiliateRule();
  //   (entity as any).program_id = dto.program_id ?? null;
  //   (entity as any).level = dto.level;
  //   (entity as any).rate_percent = String(dto.rate_percent);
  //   (entity as any).active_from = dto.active_from ? new Date(dto.active_from) : null;
  //   (entity as any).active_to = dto.active_to ? new Date(dto.active_to) : null;
  //   (entity as any).cap_per_order = dto.cap_per_order != null ? String(dto.cap_per_order) : null;
  //   (entity as any).cap_per_user = dto.cap_per_user != null ? String(dto.cap_per_user) : null;

  //   console.log('Saving entity:', entity);
  //   return await this.repo.save(entity as any);
  // }


  // async update(id: number, dto: UpdateCommissionRuleDto) {
  //   const found = await this.findOne(id);
  //   Object.assign(found, {
  //     program_id: dto.program_id ?? (found as any).program_id,
  //     level: dto.level ?? (found as any).level,
  //     rate_percent: dto.rate_percent != null ? String(dto.rate_percent) : (found as any).rate_percent,
  //     active_from: dto.active_from ? new Date(dto.active_from) : (found as any).active_from,
  //     active_to: dto.active_to ? new Date(dto.active_to) : (found as any).active_to,
  //     cap_per_order: dto.cap_per_order != null ? String(dto.cap_per_order) : (found as any).cap_per_order,
  //     cap_per_user: dto.cap_per_user != null ? String(dto.cap_per_user) : (found as any).cap_per_user,
  //   });
  //   return await this.repo.save(found);
  // }

  // async remove(id: number) {
  //   await this.findOne(id); // Check if exists
  //   await this.repo.softDelete(id);
  //   return { success: true };
  // }

  // // Soft delete all rules for a specific program
  // async softDeleteRulesByProgram(programId: number) {
  //   await this.repo.softDelete({ program_id: programId });
  //   return { success: true, message: `All commission rules for program ${programId} have been soft deleted` };
  // }

  // // Lấy rule hiệu lực tại thời điểm now theo program_id + level
  // async getActiveRule(programId: number | null, level: number, now = new Date()) {
  //   const qb = this.repo
  //     .createQueryBuilder('r')
  //     .where('r.level = :level', { level })
  //     .andWhere('r.deleted_at IS NULL'); // Exclude soft-deleted rules

  //   if (programId) qb.andWhere('r.program_id = :pid', { pid: programId });
  //   else qb.andWhere('r.program_id IS NULL');

  //   qb.andWhere('(r.active_from IS NULL OR r.active_from <= :now)', { now })
  //     .andWhere('(r.active_to IS NULL OR r.active_to >= :now)', { now })
  //     .orderBy('r.program_id', 'DESC'); // ưu tiên rule theo program, fallback NULL

  //   return await qb.getOne();
  // }

  // // Method để preview commission theo số tiền và số cấp
  // async previewCommission(dto: PreviewCommissionDto) {
  //   const { amount, maxLevels, programId } = dto;
  //   const now = new Date();
  //   const previewData = [];

  //   for (let level = 0; level <= maxLevels; level++) {
  //     const rule = await this.getActiveRule(programId ?? null, level, now);

  //     if (rule) {
  //       const rate = Number(rule.rate_percent);
  //       let computed = Math.max(0, amount * (rate / 100));

  //       // Áp dụng cap_per_order nếu có
  //       if (rule.cap_per_order != null) {
  //         const cap = Number(rule.cap_per_order);
  //         if (!Number.isNaN(cap) && cap >= 0) {
  //           computed = Math.min(computed, cap);
  //         }
  //       }

  //       computed = Math.round(computed * 100) / 100;

  //       previewData.push({
  //         level,
  //         ratePercent: rate,
  //         baseAmount: amount,
  //         commissionAmount: computed,
  //         capPerOrder: rule.cap_per_order ? Number(rule.cap_per_order) : null,
  //         hasCap: rule.cap_per_order != null,
  //         applied: computed > 0
  //       });
  //     } else {
  //       previewData.push({
  //         level,
  //         ratePercent: 0,
  //         baseAmount: amount,
  //         commissionAmount: 0,
  //         capPerOrder: null,
  //         hasCap: false,
  //         applied: false,
  //         note: 'No active rule found for this level'
  //       });
  //     }
  //   }

  //   const totalCommission = previewData.reduce((sum, item) => sum + item.commissionAmount, 0);
  //   const totalPercentage = previewData.reduce((sum, item) => sum + item.ratePercent, 0);

  //   return {
  //     inputAmount: amount,
  //     maxLevels,
  //     programId: programId ?? null,
  //     totalCommission,
  //     totalPercentage,
  //     byLevel: previewData,
  //     summary: {
  //       levelsWithCommission: previewData.filter(item => item.commissionAmount > 0).length,
  //       averageRate: previewData.length > 0 ? totalPercentage / previewData.length : 0,
  //       totalCommissionFormatted: totalCommission.toLocaleString('vi-VN', {
  //         style: 'currency',
  //         currency: 'VND'
  //       })
  //     }
  //   };
  // }

  // // Method để kiểm tra trạng thái các rules
  // async checkRulesStatus() {
  //   console.log('Checking status of all commission rules...');

  //   // Lấy tất cả rules (bao gồm cả soft-deleted)
  //   const allRules = await this.repo.find({ withDeleted: true });
  //   console.log(`Found ${allRules.length} total rules (including soft-deleted)`);

  //   const activeRules = await this.repo.find();
  //   console.log(`Found ${activeRules.length} active rules`);

  //   const report = {
  //     totalRules: allRules.length,
  //     activeRules: activeRules.length,
  //     softDeletedRules: allRules.length - activeRules.length,
  //     rulesByProgram: {} as any,
  //     invalidRules: [] as any[]
  //   };

  //   for (const rule of allRules) {
  //     const programId = rule.program_id || 'NULL';
  //     if (!report.rulesByProgram[programId]) {
  //       report.rulesByProgram[programId] = { count: 0, rules: [] };
  //     }
  //     report.rulesByProgram[programId].count++;
  //     report.rulesByProgram[programId].rules.push({
  //       id: rule.id,
  //       level: rule.level,
  //       rate_percent: rule.rate_percent,
  //       deleted_at: (rule as any).deleted_at
  //     });

  //     // Check if rule is invalid
  //     if (rule.program_id && !(rule as any).deleted_at) {
  //       const program = await this.programRepo.findOne({ where: { id: rule.program_id } });
  //       if (!program || program.status !== 'active') {
  //         report.invalidRules.push({
  //           ruleId: rule.id,
  //           programId: rule.program_id,
  //           programStatus: program?.status || 'NOT_FOUND',
  //           programName: program?.name || 'UNKNOWN'
  //         });
  //       }
  //     }
  //   }

  //   console.log('Rules status report:', report);
  //   return report;
  // }


}
