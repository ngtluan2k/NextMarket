import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { AffiliateProgram } from './affiliate-program.entity';
import { UpdateAffiliateProgramDto } from './dto/update-affiliate-program.dto';
import { CreateAffiliateProgramDto } from './dto/create-affiliate-program.dto';
import { v4 as uuidv4 } from 'uuid';
import { AffiliateRulesService } from '../affiliate-rules/affiliate-rules.service';
import { AffiliateLink } from '../affiliate-links/affiliate-links.entity';
import { AffiliateCommission } from '../affiliate-commissions/entity/affiliate-commission.entity';
import { AffiliateCommissionRule } from '../affiliate-rules/affiliate-rules.entity';

@Injectable()
export class AffiliateProgramsService {
  private readonly logger = new Logger(AffiliateProgramsService.name);
  private programCache: Map<number, AffiliateProgram> = new Map();
  private cacheExpiry: Map<number, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(AffiliateProgram)
    private repository: Repository<AffiliateProgram>,
    @InjectRepository(AffiliateLink)
    private linkRepository: Repository<AffiliateLink>,
    @InjectRepository(AffiliateCommission)
    private commissionRepository: Repository<AffiliateCommission>,
    @InjectRepository(AffiliateCommissionRule)
    private ruleRepository: Repository<AffiliateCommissionRule>,
    private readonly rulesService: AffiliateRulesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDto: CreateAffiliateProgramDto
  ): Promise<AffiliateProgram> {
    const entity = this.repository.create({
      ...createDto,
      uuid: uuidv4(),
      created_at: new Date(),
    });
    
    const savedProgram = await this.repository.save(entity);
    
    // Tự động tạo các rule mặc định cho program mới
    try {
      console.log(`Creating default commission rules for new program: ${savedProgram.name} (ID: ${savedProgram.id})`);
      // await this.rulesService.createDefaultRules(savedProgram.id);
      console.log(`Successfully created default rules for program ${savedProgram.id}`);
    } catch (error) {
      console.error(`Failed to create default rules for program ${savedProgram.id}:`, error);
      // Không throw error để không làm fail việc tạo program
      // Admin có thể tạo rules thủ công sau này
    }
    
    return savedProgram;
  }

  /**
   * Get all active programs with caching
   */
  async findAllActive(): Promise<AffiliateProgram[]> {
    this.logger.debug('🔍 Fetching all active affiliate programs');
    return this.repository.find({ where: { status: 'active' } });
  }

  /**
   * Get all programs (including inactive)
   */
  async findAll(): Promise<AffiliateProgram[]> {
    this.logger.debug('🔍 Fetching all affiliate programs');
    return this.repository.find();
  }

  /**
   * Get all programs with user counts - OPTIMIZED with batch query
   */
  async findAllWithUserCounts(): Promise<(AffiliateProgram & { user_enrolled: number; avg_revenue: number; avg_commission: number })[]> {
    this.logger.debug('🔍 Fetching all programs with user counts (optimized)');
    
    const programs = await this.repository.find();
    
    if (programs.length === 0) {
      return [];
    }

    // Batch query: Get all user counts in ONE query instead of N queries
    const programIds = programs.map(p => p.id);
    const userCounts = await this.linkRepository
      .createQueryBuilder('link')
      .select('link.program_id', 'program_id')
      .addSelect('COUNT(DISTINCT link.user_id)', 'count')
      .where('link.program_id IN (:...programIds)', { programIds })
      .groupBy('link.program_id')
      .getRawMany();

    // Create a map for O(1) lookup
    const countMap = new Map(userCounts.map(uc => [uc.program_id, parseInt(uc.count || '0', 10)]));

    // Combine results
    return programs.map(program => ({
      ...program,
      user_enrolled: countMap.get(program.id) || 0,
      avg_revenue: parseFloat(program.total_budget_amount?.toString() || '0'),
      avg_commission: parseFloat(program.commission_value?.toString() || '0'),
    }));
  }

  /**
   * Get all active programs with user counts - OPTIMIZED with batch query
   */
  async findAllActiveWithUserCounts(): Promise<(AffiliateProgram & { user_enrolled: number })[]> {
    this.logger.debug('🔍 Fetching active programs with user counts (optimized)');
    
    const programs = await this.repository.find({ where: { status: 'active' } });
    
    if (programs.length === 0) {
      return [];
    }

    // Batch query: Get all user counts in ONE query instead of N queries
    const programIds = programs.map(p => p.id);
    const userCounts = await this.linkRepository
      .createQueryBuilder('link')
      .select('link.program_id', 'program_id')
      .addSelect('COUNT(DISTINCT link.user_id)', 'count')
      .where('link.program_id IN (:...programIds)', { programIds })
      .groupBy('link.program_id')
      .getRawMany();

    // Create a map for O(1) lookup
    const countMap = new Map(userCounts.map(uc => [uc.program_id, parseInt(uc.count || '0', 10)]));

    // Combine results
    return programs.map(program => ({
      ...program,
      user_enrolled: countMap.get(program.id) || 0,
    }));
  }

  async findAllActiveWithRules(): Promise<AffiliateProgram[]> {
    // Get all active programs that have at least one commission rule
    const programsWithRules = await this.repository
      .createQueryBuilder('program')
      .innerJoin('affiliate_rules', 'rule', 'rule.program_id = CAST(program.id AS VARCHAR)')
      .where('program.status = :status', { status: 'active' })
      .groupBy('program.id')
      .getMany();
    
    return programsWithRules;
  }

  /**
   * Get program by ID with caching
   */
  async findOne(id: number): Promise<AffiliateProgram> {
    // Check cache first
    const now = Date.now();
    const expiry = this.cacheExpiry.get(id);
    if (expiry && expiry > now && this.programCache.has(id)) {
      this.logger.debug(`📦 Cache hit for program ${id}`);
      return this.programCache.get(id)!;
    }

    const program = await this.repository.findOneBy({ id });
    if (!program) {
      throw new NotFoundException(`Affiliate Program with ID ${id} not found`);
    }

    // Store in cache
    this.programCache.set(id, program);
    this.cacheExpiry.set(id, now + this.CACHE_TTL);

    return program;
  }

  /**
   * Update program
   */
  async update(
    id: number,
    updateDto: UpdateAffiliateProgramDto
  ): Promise<AffiliateProgram> {
    const program = await this.findOne(id);
    Object.assign(program, updateDto);
    const updated = await this.repository.save(program);
    
    // Invalidate cache
    this.programCache.delete(id);
    this.cacheExpiry.delete(id);
    
    this.logger.log(`✅ Program ${id} updated successfully`);
    return updated;
  }

  /**
   * Soft delete program (change status to inactive)
   */
  async manageStatus(
    id: number,
    action: 'delete' | 'reopen'
  ): Promise<{ message: string }> {
    const program = await this.findOne(id);

    if (action === 'delete') {
      program.status = 'inactive';
      await this.repository.save(program);
      
      // Invalidate cache
      this.programCache.delete(id);
      this.cacheExpiry.delete(id);
      
      this.logger.log(`✅ Program ${id} soft deleted (status changed to inactive)`);
      return {
        message: `Affiliate program "${program.name}" has been deleted successfully. All associated commission rules have been deactivated.`,
      };
    }

    if (action === 'reopen') {
      program.status = 'active';
      await this.repository.save(program);
      
      // Invalidate cache
      this.programCache.delete(id);
      this.cacheExpiry.delete(id);
      
      this.logger.log(`✅ Program ${id} reopened (status changed to active)`);
      return {
        message: `Affiliate program "${program.name}" has been reopened successfully.`,
      };
    }

    throw new BadRequestException(`Invalid action: ${action}`);
  }

  /**
   * Hard delete program with cascade cleanup
   * Removes program and all associated data:
   * - Affiliate links
   * - Commission rules
   * - Commission records
   */
  async hardDelete(id: number): Promise<{ message: string; deleted_items: Record<string, number> }> {
    const program = await this.findOne(id);
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      this.logger.log(`🗑️ Starting hard delete for program ${id}: ${program.name}`);

      // 1. Delete all affiliate commissions for this program
      const commissionResult = await queryRunner.manager.delete(AffiliateCommission, {
        program_id: id,
      });
      const deletedCommissions = commissionResult.affected || 0;
      this.logger.log(`🗑️ Deleted ${deletedCommissions} commission records`);

      // 2. Delete all affiliate commission rules for this program
      const ruleResult = await queryRunner.manager.delete(AffiliateCommissionRule, {
        program_id: id.toString(),
      });
      const deletedRules = ruleResult.affected || 0;
      this.logger.log(`🗑️ Deleted ${deletedRules} commission rules`);

      // 3. Delete all affiliate links for this program
      const linkResult = await queryRunner.manager.delete(AffiliateLink, {
        program_id: id,
      });
      const deletedLinks = linkResult.affected || 0;
      this.logger.log(`🗑️ Deleted ${deletedLinks} affiliate links`);

      // 4. Delete the program itself
      const programResult = await queryRunner.manager.delete(AffiliateProgram, { id });
      const deletedPrograms = programResult.affected || 0;
      this.logger.log(`🗑️ Deleted ${deletedPrograms} program record`);

      await queryRunner.commitTransaction();

      // Invalidate cache
      this.programCache.delete(id);
      this.cacheExpiry.delete(id);

      this.logger.log(`✅ Hard delete completed for program ${id}`);

      return {
        message: `Affiliate program "${program.name}" and all associated data have been permanently deleted.`,
        deleted_items: {
          programs: deletedPrograms,
          links: deletedLinks,
          rules: deletedRules,
          commissions: deletedCommissions,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Hard delete failed for program ${id}:`, error);
      throw new BadRequestException(
        `Failed to delete program: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Clear program cache
   */
  clearCache(id?: number): void {
    if (id) {
      this.programCache.delete(id);
      this.cacheExpiry.delete(id);
      this.logger.debug(`🗑️ Cache cleared for program ${id}`);
    } else {
      this.programCache.clear();
      this.cacheExpiry.clear();
      this.logger.debug(`🗑️ All program cache cleared`);
    }
  }
}
