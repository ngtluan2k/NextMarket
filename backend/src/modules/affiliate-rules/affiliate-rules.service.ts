import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';
import { UpdateCommissionRuleDto } from './dto/update-commission-rule.dto';

import { AffiliateCommissionRule } from './affiliate-rules.entity';
import { AffiliateProgram } from '../affiliate-program/affiliate-program.entity';

@Injectable()
export class AffiliateRulesService {
  constructor(
    @InjectRepository(AffiliateCommissionRule)
    private readonly repo: Repository<AffiliateCommissionRule>,
    @InjectRepository(AffiliateProgram)
    private readonly programRepo: Repository<AffiliateProgram>,
  ) {}

  async create(dto: CreateCommissionRuleDto) {
    console.log('Creating commission rule with DTO:', dto);
    
    // Validate program_id if provided
    if (dto.program_id !== null && dto.program_id !== undefined) {
      console.log(`Checking program status for ID: ${dto.program_id}`);
      const program = await this.programRepo.findOne({ where: { id: dto.program_id } });
      console.log('Found program:', program);
      
      if (!program) {
        throw new NotFoundException(`Affiliate program with ID ${dto.program_id} not found`);
      }
      
      console.log(`Program status: ${program.status}`);
      if (program.status !== 'active') {
        throw new BadRequestException(`Cannot create commission rule for inactive affiliate program "${program.name}" (Status: ${program.status})`);
      }
    } else {
      console.log('Creating rule for default program (program_id is null)');
    }

    const entity = new AffiliateCommissionRule();
    (entity as any).program_id = dto.program_id ?? null;
    (entity as any).level = dto.level;
    (entity as any).rate_percent = String(dto.rate_percent);
    (entity as any).active_from = dto.active_from ? new Date(dto.active_from) : null;
    (entity as any).active_to = dto.active_to ? new Date(dto.active_to) : null;
    (entity as any).cap_per_order = dto.cap_per_order != null ? String(dto.cap_per_order) : null;
    (entity as any).cap_per_user = dto.cap_per_user != null ? String(dto.cap_per_user) : null;
    
    console.log('Saving entity:', entity);
    return await this.repo.save(entity as any);
  }

  async findAll() {
    return await this.repo.find({ order: { program_id: 'ASC', level: 'ASC' } });
  }

  async findOne(id: number) {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Commission rule not found');
    return found;
  }

  async update(id: number, dto: UpdateCommissionRuleDto) {
    const found = await this.findOne(id);
    Object.assign(found, {
      program_id: dto.program_id ?? (found as any).program_id,
      level: dto.level ?? (found as any).level,
      rate_percent: dto.rate_percent != null ? String(dto.rate_percent) : (found as any).rate_percent,
      active_from: dto.active_from ? new Date(dto.active_from) : (found as any).active_from,
      active_to: dto.active_to ? new Date(dto.active_to) : (found as any).active_to,
      cap_per_order: dto.cap_per_order != null ? String(dto.cap_per_order) : (found as any).cap_per_order,
      cap_per_user: dto.cap_per_user != null ? String(dto.cap_per_user) : (found as any).cap_per_user,
    });
    return await this.repo.save(found);
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists
    await this.repo.softDelete(id);
    return { success: true };
  }

  // Soft delete all rules for a specific program
  async softDeleteRulesByProgram(programId: number) {
    await this.repo.softDelete({ program_id: programId });
    return { success: true, message: `All commission rules for program ${programId} have been soft deleted` };
  }

  // Lấy rule hiệu lực tại thời điểm now theo program_id + level
  async getActiveRule(programId: number | null, level: number, now = new Date()) {
    const qb = this.repo
      .createQueryBuilder('r')
      .where('r.level = :level', { level })
      .andWhere('r.deleted_at IS NULL'); // Exclude soft-deleted rules

    if (programId) qb.andWhere('r.program_id = :pid', { pid: programId });
    else qb.andWhere('r.program_id IS NULL');

    qb.andWhere('(r.active_from IS NULL OR r.active_from <= :now)', { now })
      .andWhere('(r.active_to IS NULL OR r.active_to >= :now)', { now })
      .orderBy('r.program_id', 'DESC'); // ưu tiên rule theo program, fallback NULL

    return await qb.getOne();
  }

  // Method để kiểm tra trạng thái các rules
  async checkRulesStatus() {
    console.log('Checking status of all commission rules...');
    
    // Lấy tất cả rules (bao gồm cả soft-deleted)
    const allRules = await this.repo.find({ withDeleted: true });
    console.log(`Found ${allRules.length} total rules (including soft-deleted)`);
    
    const activeRules = await this.repo.find();
    console.log(`Found ${activeRules.length} active rules`);
    
    const report = {
      totalRules: allRules.length,
      activeRules: activeRules.length,
      softDeletedRules: allRules.length - activeRules.length,
      rulesByProgram: {} as any,
      invalidRules: [] as any[]
    };
    
    for (const rule of allRules) {
      const programId = rule.program_id || 'NULL';
      if (!report.rulesByProgram[programId]) {
        report.rulesByProgram[programId] = { count: 0, rules: [] };
      }
      report.rulesByProgram[programId].count++;
      report.rulesByProgram[programId].rules.push({
        id: rule.id,
        level: rule.level,
        rate_percent: rule.rate_percent,
        deleted_at: (rule as any).deleted_at
      });
      
      // Check if rule is invalid
      if (rule.program_id && !(rule as any).deleted_at) {
        const program = await this.programRepo.findOne({ where: { id: rule.program_id } });
        if (!program || program.status !== 'active') {
          report.invalidRules.push({
            ruleId: rule.id,
            programId: rule.program_id,
            programStatus: program?.status || 'NOT_FOUND',
            programName: program?.name || 'UNKNOWN'
          });
        }
      }
    }
    
    console.log('Rules status report:', report);
    return report;
  }

  // Method để kiểm tra và cleanup các rule không hợp lệ
  async validateAndCleanupRules() {
    console.log('Starting validation and cleanup of commission rules...');
    
    // Lấy tất cả rules
    const allRules = await this.repo.find();
    console.log(`Found ${allRules.length} total rules`);
    
    let cleanedCount = 0;
    
    for (const rule of allRules) {
      if (rule.program_id) {
        const program = await this.programRepo.findOne({ where: { id: rule.program_id } });
        
        if (!program) {
          console.log(`Rule ${rule.id} references non-existent program ${rule.program_id}, soft deleting...`);
          await this.repo.softDelete(rule.id);
          cleanedCount++;
        } else if (program.status !== 'active') {
          console.log(`Rule ${rule.id} references inactive program ${rule.program_id} (${program.name}), soft deleting...`);
          await this.repo.softDelete(rule.id);
          cleanedCount++;
        }
      }
    }
    
    console.log(`Cleanup completed. Soft deleted ${cleanedCount} invalid rules.`);
    return { cleanedCount, totalRules: allRules.length };
  }
}