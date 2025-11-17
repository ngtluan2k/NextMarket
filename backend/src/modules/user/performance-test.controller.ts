import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { BcryptPerformanceService } from './bcrypt-performance.service';

@ApiTags('Performance Testing')
@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PerformanceTestController {
  constructor(
    private readonly bcryptPerformanceService: BcryptPerformanceService
  ) {}

  @Get('bcrypt/benchmark')
  @Roles('admin')
  @ApiOperation({ summary: 'Benchmark bcrypt salt rounds performance' })
  async benchmarkBcrypt() {
    console.log('🧪 Starting bcrypt benchmark...');
    await this.bcryptPerformanceService.benchmarkSaltRounds();
    
    return {
      status: 200,
      message: 'Benchmark completed. Check server logs for detailed results.',
      recommendation: {
        fast: 'Salt rounds 8 (~50ms) - Development/Testing',
        standard: 'Salt rounds 10 (~100-300ms) - Production (Recommended)',
        secure: 'Salt rounds 12 (~500-1000ms) - High Security',
        paranoid: 'Salt rounds 14+ (~2s+) - Maximum Security (Not recommended for login)'
      }
    };
  }

  @Post('bcrypt/test-hash')
  @Roles('admin')
  @ApiOperation({ summary: 'Test password hashing with different salt rounds' })
  async testPasswordHashing(@Body() body: { password: string; saltRounds?: number }) {
    const { password, saltRounds = 10 } = body;
    
    const startTime = Date.now();
    const hash = await this.bcryptPerformanceService.hashPassword(password, saltRounds);
    const hashDuration = Date.now() - startTime;
    
    const compareStart = Date.now();
    const isMatch = await this.bcryptPerformanceService.comparePassword(password, hash);
    const compareDuration = Date.now() - compareStart;
    
    const saltInfo = this.bcryptPerformanceService.detectHighSaltRounds(hash);
    
    return {
      status: 200,
      data: {
        saltRounds,
        hashDuration: `${hashDuration}ms`,
        compareDuration: `${compareDuration}ms`,
        totalDuration: `${hashDuration + compareDuration}ms`,
        hash: hash.substring(0, 29) + '...', // Show partial hash for security
        isMatch,
        saltInfo,
        performance: {
          rating: hashDuration < 100 ? 'Excellent' : 
                  hashDuration < 500 ? 'Good' : 
                  hashDuration < 1000 ? 'Acceptable' : 'Slow',
          recommendation: hashDuration > 1000 ? 'Consider reducing salt rounds' : 'Performance is acceptable'
        }
      }
    };
  }

  @Post('bcrypt/analyze-hash')
  @Roles('admin')
  @ApiOperation({ summary: 'Analyze existing password hash' })
  async analyzeHash(@Body() body: { hash: string }) {
    const { hash } = body;
    
    const saltInfo = this.bcryptPerformanceService.detectHighSaltRounds(hash);
    
    return {
      status: 200,
      data: {
        hash: hash.substring(0, 29) + '...', // Show partial hash for security
        saltInfo,
        recommendation: saltInfo.isHighSalt 
          ? 'This hash uses high salt rounds and may cause slow login. Consider rehashing on next user login.'
          : 'This hash uses acceptable salt rounds for good performance.'
      }
    };
  }

  @Get('login/simulate')
  @Roles('admin')
  @ApiOperation({ summary: 'Simulate login performance with different scenarios' })
  async simulateLoginPerformance() {
    const scenarios = [
      { name: 'Fast (Salt 8)', saltRounds: 8 },
      { name: 'Standard (Salt 10)', saltRounds: 10 },
      { name: 'Secure (Salt 12)', saltRounds: 12 },
      { name: 'Legacy High (Salt 14)', saltRounds: 14 },
      { name: 'Very High (Salt 16)', saltRounds: 16 }
    ];
    
    const results = [];
    const testPassword = 'TestPassword123!';
    
    for (const scenario of scenarios) {
      console.log(`🧪 Testing ${scenario.name}...`);
      
      // Hash password
      const hashStart = Date.now();
      const hash = await this.bcryptPerformanceService.hashPassword(testPassword, scenario.saltRounds);
      const hashDuration = Date.now() - hashStart;
      
      // Compare password (simulate login)
      const compareStart = Date.now();
      await this.bcryptPerformanceService.comparePassword(testPassword, hash);
      const compareDuration = Date.now() - compareStart;
      
      results.push({
        scenario: scenario.name,
        saltRounds: scenario.saltRounds,
        hashTime: `${hashDuration}ms`,
        loginTime: `${compareDuration}ms`, // This is what users experience during login
        rating: compareDuration < 100 ? 'Excellent' : 
                compareDuration < 500 ? 'Good' : 
                compareDuration < 1000 ? 'Acceptable' : 
                compareDuration < 5000 ? 'Slow' : 'Unacceptable'
      });
    }
    
    return {
      status: 200,
      message: 'Login performance simulation completed',
      data: results,
      recommendation: 'Use Salt 10 for optimal balance of security and performance. Salt 12+ may cause noticeable login delays.'
    };
  }
}
