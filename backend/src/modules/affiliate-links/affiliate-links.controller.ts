// modules/affiliate-links/affiliate-links.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AffiliateLinksService } from './affiliate-links.service';

interface AuthRequest extends Request {
  user: { userId: number; roles?: string[] };
}

@Controller('affiliate-links')
@UseGuards(JwtAuthGuard)
export class AffiliateLinksController {
  constructor(private readonly service: AffiliateLinksService) {}

  @Post('create-link')
  async createAffiliateLink(
    @Request() req: AuthRequest,
    @Body() body: { productId: number; variantId?: number; programId?: number },
  ) {
    const userId = req.user.userId;
    return this.service.createAffiliateLink(userId, body.productId, body.variantId, body.programId);
  }

  @Get('my-links')
  async getMyLinks(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.getMyLinks(userId);
  }

  @Delete(':id')
  async deleteMyLink(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.deleteMyLink(id, userId);
  }

  @Get('affiliated-products')
  async getAffiliatedProducts(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.getAffiliatedProducts(userId);
  }

  @Get('dashboard-stats')
  async getDashboardStats(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.getDashboardStats(userId);
  }

  @Get('commission-history')
  async getCommissionHistory(
    @Request() req: AuthRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userId = req.user.userId;
    return this.service.getCommissionHistory(userId, page || 1, limit || 20);
  }

  @Get('commission-summary')
  async getCommissionSummary(
    @Request() req: AuthRequest,
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('limit') limit?: number
  ) {
    const userId = req.user.userId;
    return this.service.getCommissionSummaryByPeriod(userId, period || 'monthly', limit || 12);
  }

  @Get('balance')
  async getBalance(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.getAvailableBalance(userId);
  }

  @Get('search-products')
  async searchProducts(
    @Request() req: AuthRequest,
    @Query('search') search: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userId = req.user.userId;
    return this.service.searchProductsForAffiliate(userId, search, page || 1, limit || 20);
  }
}