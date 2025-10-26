// modules/affiliate-links/affiliate-links.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
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
}