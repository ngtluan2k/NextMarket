import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateProgram } from './affiliate-program.entity';
import { UpdateAffiliateProgramDto } from './dto/update-affiliate-program.dto';
import { CreateAffiliateProgramDto } from './dto/create-affiliate-program.dto';
import { v4 as uuidv4 } from 'uuid';
import { AffiliateRulesService } from '../affiliate-rules/affiliate-rules.service';

@Injectable()
export class AffiliateProgramsService {
  constructor(
    @InjectRepository(AffiliateProgram)
    private repository: Repository<AffiliateProgram>,
    private readonly rulesService: AffiliateRulesService,
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
      await this.rulesService.createDefaultRules(savedProgram.id);
      console.log(`Successfully created default rules for program ${savedProgram.id}`);
    } catch (error) {
      console.error(`Failed to create default rules for program ${savedProgram.id}:`, error);
      // Không throw error để không làm fail việc tạo program
      // Admin có thể tạo rules thủ công sau này
    }
    
    return savedProgram;
  }

  async findAllActive(): Promise<AffiliateProgram[]> {
    return this.repository.find({ where: { status: 'active' } });
  }

  async findAll(): Promise<AffiliateProgram[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<AffiliateProgram> {
    const program = await this.repository.findOneBy({ id });
    if (!program) {
      throw new NotFoundException(`Affiliate Program with ID ${id} not found`);
    }
    return program;
  }

  async update(
    id: number,
    updateDto: UpdateAffiliateProgramDto
  ): Promise<AffiliateProgram> {
    const program = await this.findOne(id);
    Object.assign(program, updateDto);
    return this.repository.save(program);
  }

  async manageStatus(
    id: number,
    action: 'delete' | 'reopen'
  ): Promise<{ message: string }> {
    const program = await this.findOne(id);

    if (action === 'delete') {
      program.status = 'inactive';
      await this.repository.save(program);
      
      // Soft delete all commission rules for this program
      await this.rulesService.softDeleteRulesByProgram(program.id);
      
      return {
        message: `Affiliate program "${program.name}" has been deleted successfully. All associated commission rules have been deactivated.`,
      };
    }

    if (action === 'reopen') {
      program.status = 'active';
      await this.repository.save(program);
      return {
        message: `Affiliate program "${program.name}" has been reopened successfully.`,
      };
    }

    throw new Error(`Invalid action: ${action}`);
  }
}
