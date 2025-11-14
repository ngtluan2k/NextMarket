import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { AffiliateProgram } from '../affiliate-program.entity';
import { AffiliateCommission } from '../../affiliate-commissions/entity/affiliate-commission.entity';

@Injectable()
export class BudgetTrackingService {
  private readonly logger = new Logger(BudgetTrackingService.name);

  constructor(
    @InjectRepository(AffiliateProgram)
    private readonly programRepo: Repository<AffiliateProgram>,
    @InjectRepository(AffiliateCommission)
    private readonly commissionRepo: Repository<AffiliateCommission>,
  ) {}

  /**
   * Check if budget is available for a commission amount
   */
  async checkBudgetAvailable(
    programId: number,
    amount: number,
  ): Promise<{ available: boolean; reason?: string }> {
    const program = await this.programRepo.findOne({
      where: { id: programId },
    });

    if (!program) {
      return { available: false, reason: 'Program not found' };
    }

    // Check total budget
    if (program.total_budget_amount > 0) {
      const available =
        program.total_budget_amount -
        Number(program.spent_budget) -
        Number(program.pending_budget);

      if (available < amount) {
        this.logger.warn(
          `Program ${programId}: Total budget exceeded. Available: ${available}, Requested: ${amount}`,
        );
        return {
          available: false,
          reason: `Total budget exceeded. Available: ${available.toFixed(2)}`,
        };
      }
    }

    // Check monthly cap
    if (program.monthly_budget_cap && program.monthly_budget_cap > 0) {
      const monthlySpent = await this.getMonthlySpent(programId);
      if (Number(monthlySpent) + amount > Number(program.monthly_budget_cap)) {
        this.logger.warn(
          `Program ${programId}: Monthly budget cap exceeded. Spent: ${monthlySpent}, Cap: ${program.monthly_budget_cap}`,
        );
        return {
          available: false,
          reason: `Monthly budget cap exceeded. Spent: ${monthlySpent.toFixed(2)}, Cap: ${program.monthly_budget_cap}`,
        };
      }
    }

    // Check daily cap
    if (program.daily_budget_cap && program.daily_budget_cap > 0) {
      const dailySpent = await this.getDailySpent(programId);
      if (Number(dailySpent) + amount > Number(program.daily_budget_cap)) {
        this.logger.warn(
          `Program ${programId}: Daily budget cap exceeded. Spent: ${dailySpent}, Cap: ${program.daily_budget_cap}`,
        );
        return {
          available: false,
          reason: `Daily budget cap exceeded. Spent: ${dailySpent.toFixed(2)}, Cap: ${program.daily_budget_cap}`,
        };
      }
    }

    return { available: true };
  }

  /**
   * Reserve budget when creating PENDING commission
   */
  async reserveBudget(programId: number, amount: number): Promise<void> {
    this.logger.log(
      `Reserving budget for program ${programId}: ${amount.toFixed(2)}`,
    );

    await this.programRepo.increment(
      { id: programId },
      'pending_budget',
      amount,
    );
  }

  /**
   * Commit budget when commission is PAID (pending -> spent)
   */
  async commitBudget(programId: number, amount: number): Promise<void> {
    this.logger.log(
      `Committing budget for program ${programId}: ${amount.toFixed(2)}`,
    );

    // Move from pending to spent
    await this.programRepo.decrement(
      { id: programId },
      'pending_budget',
      amount,
    );
    await this.programRepo.increment({ id: programId }, 'spent_budget', amount);

    // Check if should auto-pause
    const program = await this.programRepo.findOne({
      where: { id: programId },
    });

    if (program && program.auto_pause_on_budget_limit) {
      const remaining =
        Number(program.total_budget_amount) - Number(program.spent_budget);

      if (remaining <= 0) {
        await this.pauseProgram(programId, 'Budget limit reached');
      }
    }
  }

  /**
   * Release budget when commission is REVERSED or VOIDED
   */
  async releaseBudget(
    programId: number,
    amount: number,
    status: 'PENDING' | 'PAID',
  ): Promise<void> {
    this.logger.log(
      `Releasing budget for program ${programId}: ${amount.toFixed(2)} (status: ${status})`,
    );

    if (status === 'PENDING') {
      // Release from pending
      await this.programRepo.decrement(
        { id: programId },
        'pending_budget',
        amount,
      );
    } else if (status === 'PAID') {
      // Release from spent
      await this.programRepo.decrement(
        { id: programId },
        'spent_budget',
        amount,
      );
    }
  }

  /**
   * Pause program
   */
  async pauseProgram(programId: number, reason: string): Promise<void> {
    this.logger.warn(`Pausing program ${programId}: ${reason}`);

    await this.programRepo.update(
      { id: programId },
      {
        status: 'PAUSED',
        paused_reason: reason,
      },
    );

    // TODO: Send notification to admin
    this.logger.log(`Program ${programId} has been auto-paused: ${reason}`);
  }

  /**
   * Get monthly spent amount
   */
  async getMonthlySpent(programId: number): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const result = await this.commissionRepo
      .createQueryBuilder('commission')
      .select('SUM(commission.amount)', 'total')
      .where('commission.program_id = :programId', { programId })
      .andWhere('commission.status IN (:...statuses)', {
        statuses: ['PENDING', 'PAID'],
      })
      .andWhere('commission.created_at BETWEEN :start AND :end', {
        start: startOfMonth,
        end: endOfMonth,
      })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Get daily spent amount
   */
  async getDailySpent(programId: number): Promise<number> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const result = await this.commissionRepo
      .createQueryBuilder('commission')
      .select('SUM(commission.amount)', 'total')
      .where('commission.program_id = :programId', { programId })
      .andWhere('commission.status IN (:...statuses)', {
        statuses: ['PENDING', 'PAID'],
      })
      .andWhere('commission.created_at BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .getRawOne();

    return Number(result?.total || 0);
  }

  /**
   * Get budget status for a program
   */
  async getBudgetStatus(programId: number) {
    const program = await this.programRepo.findOne({
      where: { id: programId },
    });

    if (!program) {
      throw new Error('Program not found');
    }

    const monthlySpent = await this.getMonthlySpent(programId);
    const dailySpent = await this.getDailySpent(programId);

    const totalBudget = Number(program.total_budget_amount);
    const spent = Number(program.spent_budget);
    const pending = Number(program.pending_budget);
    const available = totalBudget - spent - pending;
    const percentageUsed = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

    return {
      program_id: programId,
      program_name: program.name,
      total_budget: totalBudget,
      spent: spent,
      pending: pending,
      available: available,
      percentage_used: percentageUsed,
      monthly_cap: program.monthly_budget_cap
        ? Number(program.monthly_budget_cap)
        : null,
      monthly_spent: monthlySpent,
      daily_cap: program.daily_budget_cap
        ? Number(program.daily_budget_cap)
        : null,
      daily_spent: dailySpent,
      auto_pause_enabled: program.auto_pause_on_budget_limit,
      status: program.status,
      paused_reason: program.paused_reason,
    };
  }

  /**
   * Get programs near budget limit (< 20% remaining)
   */
  async getProgramsNearBudgetLimit(): Promise<any[]> {
    const programs = await this.programRepo.find({
      where: { status: 'ACTIVE' },
    });

    const nearLimitPrograms = [];

    for (const program of programs) {
      if (program.total_budget_amount <= 0) continue;

      const totalBudget = Number(program.total_budget_amount);
      const spent = Number(program.spent_budget);
      const pending = Number(program.pending_budget);
      const available = totalBudget - spent - pending;
      const percentageRemaining = (available / totalBudget) * 100;

      if (percentageRemaining < 20) {
        nearLimitPrograms.push({
          program_id: program.id,
          program_name: program.name,
          total_budget: totalBudget,
          available: available,
          percentage_remaining: percentageRemaining,
        });
      }
    }

    return nearLimitPrograms;
  }
}
