import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AffiliateRulesService } from './affiliate-rules.service';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';
import { UpdateCommissionRuleDto } from './dto/update-commission-rule.dto';
import { PreviewCommissionDto } from './dto/preview-commission.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
@Controller('affiliate-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AffiliateRulesController {
  constructor(private readonly service: AffiliateRulesService) {}

  @Post()
  @Roles('Admin')
  create(@Body() dto: CreateCommissionRuleDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('Admin')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('Admin')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('Admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommissionRuleDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get('status')
  @Roles('Admin')
  checkStatus() {
    return this.service.checkRulesStatus();
  }

  @Post('cleanup')
  @Roles('Admin')
  validateAndCleanup() {
    return this.service.validateAndCleanupRules();
  }

  @Post('preview-commission')
  @Roles('Admin')
  async previewCommission(@Body() dto: PreviewCommissionDto) {
    return this.service.previewCommission(dto);
  }
}
