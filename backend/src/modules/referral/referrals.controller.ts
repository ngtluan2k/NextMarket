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
import { ReferralsService } from './referrals.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
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

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly service: ReferralsService) {}

  @Post('create')
  async create(
    @Request() req: AuthRequest,
    @Body() createDto: CreateReferralDto
  ) {
    return this.service.createForUser(req.user.id, createDto);
  }

  @Get('my-referrals')
  async findUserReferrals(@Request() req: AuthRequest) {
    return this.service.findUserReferrals(req.user.id);
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
  update(@Param('id') id: string, @Body() updateDto: UpdateReferralDto) {
    return this.service.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
