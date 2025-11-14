import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BcryptPerformanceService {
  private readonly logger = new Logger(BcryptPerformanceService.name);
  
  private readonly SALT_ROUNDS = {
    FAST: 8,       
    STANDARD: 10,
    SECURE: 12,  
    PARANOID: 14, 
  };

  async hashPassword(password: string, saltRounds: number = this.SALT_ROUNDS.STANDARD): Promise<string> {
    const startTime = Date.now();
    
    try {
      const hash = await bcrypt.hash(password, saltRounds);
      const duration = Date.now() - startTime;
      
      this.logger.log(`🔐 Password hashed in ${duration}ms (salt rounds: ${saltRounds})`);
      
      if (duration > 1000) {
        this.logger.warn(`⚠️ Slow password hashing detected: ${duration}ms. Consider reducing salt rounds.`);
      }
      
      return hash;
    } catch (error : any) {
      this.logger.error(`❌ Password hashing failed: ${error.message}`);
      throw error;
    }
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const isMatch = await bcrypt.compare(password, hash);
      const duration = Date.now() - startTime;
      
      this.logger.log(`🔍 Password compared in ${duration}ms`);
      
      if (duration > 1000) {
        this.logger.warn(`⚠️ Slow password comparison: ${duration}ms. User may have legacy high-salt password.`);
        this.logger.warn(`💡 Consider rehashing user password with lower salt rounds on next login.`);
      }
      
      return isMatch;
    } catch (error: any) {
      this.logger.error(`❌ Password comparison failed: ${error.message}`);
      throw error;
    }
  }

  async benchmarkSaltRounds(): Promise<void> {
    const testPassword = 'TestPassword123!';
    const rounds = [8, 10, 12, 14, 16];
    
    this.logger.log('🧪 Benchmarking bcrypt salt rounds...');
    
    for (const saltRounds of rounds) {
      const startTime = Date.now();
      const hash = await bcrypt.hash(testPassword, saltRounds);
      const hashDuration = Date.now() - startTime;
      
      const compareStart = Date.now();
      await bcrypt.compare(testPassword, hash);
      const compareDuration = Date.now() - compareStart;
      
      this.logger.log(`📊 Salt ${saltRounds}: Hash=${hashDuration}ms, Compare=${compareDuration}ms`);
    }
  }


  detectHighSaltRounds(hash: string): { isHighSalt: boolean; estimatedRounds: number } {
    const parts = hash.split('$');
    if (parts.length >= 3) {
      const rounds = parseInt(parts[2], 10);
      return {
        isHighSalt: rounds > 12,
        estimatedRounds: rounds
      };
    }
    
    return { isHighSalt: false, estimatedRounds: 10 };
  }


  getRecommendedSaltRounds(performanceLevel: 'fast' | 'standard' | 'secure' | 'paranoid' = 'standard'): number {
    switch (performanceLevel) {
      case 'fast': return this.SALT_ROUNDS.FAST;
      case 'standard': return this.SALT_ROUNDS.STANDARD;
      case 'secure': return this.SALT_ROUNDS.SECURE;
      case 'paranoid': return this.SALT_ROUNDS.PARANOID;
      default: return this.SALT_ROUNDS.STANDARD;
    }
  }
}
