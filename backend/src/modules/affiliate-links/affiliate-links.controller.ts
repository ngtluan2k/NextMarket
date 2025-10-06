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
} from '@nestjs/common';
import { AffiliateLinksService } from './affiliate-links.service';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';
import { UpdateAffiliateLinkDto } from './dto/update-affiliate-link.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
interface AuthRequest extends ExpressRequest {
  user: {
    id: number;
    email: string;
    roles: string[];
    permissions: string[];
  };
}
@Controller('affiliate-links')
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateAffiliateLinkDto) {
    return this.service.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register')
  async register(@Request() req: AuthRequest) {
    const userId = req.user.id;
    console.log("+++++++++++++++ register to be an affiliate with user : " + JSON.stringify(req, null, 0 ))
    return this.service.register(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unregister')
  async unregister(@Request() req: AuthRequest) {
    const userId = req.user.id;
    return this.service.unregister(userId);
  }


  @UseGuards(JwtAuthGuard)
  @Post('create-link')
  async createAffiliateLink(
    @Request() req: AuthRequest,
    @Body() body: { productId: number; variantSlug?: string }
  ) {
    const userId = req.user.id;
    return this.service.createAffiliateLink(
      userId,
      body.productId,
      body.variantSlug
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-links')
  async getMyLinks(@Request() req: AuthRequest) {
    const userId = req.user.id;
    return this.service.getMyLinks(userId);
  }
}
