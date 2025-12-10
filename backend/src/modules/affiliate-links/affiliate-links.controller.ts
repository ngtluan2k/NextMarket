// modules/affiliate-links/affiliate-links.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AffiliateLinksService } from './affiliate-links.service';

interface AuthRequest extends Request {
  user: { userId: number; roles?: string[] };
}

@Controller('affiliate-links')
export class AffiliateLinksController {
  constructor(private readonly service: AffiliateLinksService) {}

  @Post('create-link')
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Limit: max 5 link creations per 60 seconds per user
  async createAffiliateLink(
    @Request() req: AuthRequest,
    @Body() body: { productId: number; variantId?: number; programId?: number },
  ) {
    const userId = req.user.userId;
    console.log(`[THROTTLE] User ${userId} attempting to create affiliate link`);
    console.log(`[DEBUG] Request body:`, body);
    console.log(`[DEBUG] User from JWT:`, req.user);
    
    try {
      const result = await this.service.createAffiliateLink(userId, body.productId, body.variantId, body.programId);
      console.log(`[SUCCESS] Affiliate link created successfully for user ${userId}`);
      return result;
    } catch (error: any) {
      console.log(`[ERROR] Failed to create affiliate link for user ${userId}:`, error.message);
      throw error;
    }
  }

  @Get('my-links')
  @UseGuards(JwtAuthGuard)
  async getMyLinks(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.getMyLinks(userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteMyLink(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.deleteMyLink(id, userId);
  }

  @Get('affiliated-products')
  @UseGuards(JwtAuthGuard)
  async getAffiliatedProducts(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.getAffiliatedProducts(userId);
  }

  @Get('dashboard-stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.getDashboardStats(userId);
  }

  @Get('commission-history')
  @UseGuards(JwtAuthGuard)
  async getCommissionHistory(
    @Request() req: AuthRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userId = req.user.userId;
    return this.service.getCommissionHistory(userId, page || 1, limit || 20);
  }

  @Get('commission-summary')
  @UseGuards(JwtAuthGuard)
  async getCommissionSummary(
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.userId;
    return this.service.getUserCommissionSummary(userId);
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.getAvailableBalance(userId);
  }

  @Get('search-products')
  @UseGuards(JwtAuthGuard)
  async searchProducts(
    @Request() req: AuthRequest,
    @Query('search') search: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userId = req.user.userId;
    return this.service.searchProductsForAffiliate(userId, search, page || 1, limit || 20);
  }

  @Post('track-click')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 clicks per minute per IP
  async trackClick(
    @Body() body: {
      affiliateCode: string;
      clickId: string;
      productId?: number;
      variantId?: number;
      programId?: number;
      source?: string;
      timestamp: number;
    },
    @Request() req: any,
  ) {
    try {
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const referrer = req.headers['referer'] || req.headers['referrer'];

      await this.service.trackClick({
        ...body,
        ipAddress,
        userAgent,
        referrer,
      });

      return {
        success: true,
        message: 'Click tracked successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to track click',
      };
    }
  }
}