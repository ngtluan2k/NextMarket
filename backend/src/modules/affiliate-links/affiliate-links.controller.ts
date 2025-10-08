import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import { AffiliateLinksService } from './affiliate-links.service';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';
import { UpdateAffiliateLinkDto } from './dto/update-affiliate-link.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: {
    userId: number;
    email: string;
    roles: string[];
    permissions: string[];
  };
}

@Controller('affiliate-links')
@UseGuards(JwtAuthGuard)
export class AffiliateLinksController {
  constructor(private readonly service: AffiliateLinksService) {}

  @Post()
  create(@Body() createDto: CreateAffiliateLinkDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Post('register')
  async register(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.register(userId);
  }

  @Post('unregister')
  async unregister(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.unregister(userId);
  }

  @Post('create-link')
  async createAffiliateLink(
    @Request() req: AuthRequest,
    @Body() body: { productId: number; variantId: number },
  ) {
    const userId = req.user.userId;
    return this.service.createAffiliateLink(userId, body.productId, body.variantId);
  }

  @Get('my-links')
  async getMyLinks(@Request() req: AuthRequest) {
    const userId = req.user.userId; 
    console.log("user id current : "+ req.user.userId)
    return this.service.getMyLinks(userId);
  }

  @Get('affiliated-products')
  async getAffiliatedProducts(@Request() req: AuthRequest) {
    const userId = req.user.userId;
    return this.service.getAffiliatedProducts(userId);
  }

  @Delete(':id')
  @HttpCode(200) 
  async deleteMyLink(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.userId;
    return this.service.deleteMyLink(id, userId);
  }
}