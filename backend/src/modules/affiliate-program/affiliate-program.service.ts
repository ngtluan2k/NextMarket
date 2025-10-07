import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AffiliateProgram } from './affiliate-program.entity';
import { CreateAffiliateProgramDto } from './dto/create-affiliate-program.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AffiliateProgramsService {
  constructor(
    @InjectRepository(AffiliateProgram)
    private repository: Repository<AffiliateProgram>,
  ) {}

  async create(createDto: CreateAffiliateProgramDto): Promise<AffiliateProgram> {
    const entity = this.repository.create({
      ...createDto,
      uuid: uuidv4(),
      created_at: new Date(),
    });
    return this.repository.save(entity);
  }

  async findAllActive(): Promise<AffiliateProgram[]> {
    return this.repository.find({ where: { status: 'active' } });
  }

  async findOne(id: number): Promise<AffiliateProgram> {
    const program = await this.repository.findOneBy({ id });
    if (!program) {
      throw new NotFoundException(`Affiliate Program with ID ${id} not found`);
    }
    return program;
  }

  async remove(id: number): Promise<{ message: string }> {
    const program = await this.findOne(id);
    program.status = 'inactive';
    await this.repository.save(program);
    return {
      message: `Affiliate program "${program.name}" has been set to inactive.`,
    };
  }
}