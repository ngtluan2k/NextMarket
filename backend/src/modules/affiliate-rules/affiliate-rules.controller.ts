import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AffiliateRulesService } from './affiliate-rules.service';
import { CreateRuleDto } from './dto/create-commission-rule.dto';
import { UpdateCommissionRuleDto } from './dto/update-commission-rule.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import {
  PreviewRuleDto,
  PreviewRuleResponseDto,
} from './dto/PreviewRuleDto.dto';
import { CalculationMethodService } from './service/rule-calculator.service';
@Controller('affiliate-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AffiliateRulesController {
  constructor(
    private readonly service: AffiliateRulesService,
    private readonly calculatorService: CalculationMethodService
  ) {}

  @Post()
  create(@Body() dto: CreateRuleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  preview(@Body() dto: PreviewRuleDto): PreviewRuleResponseDto {
    return this.calculatorService.calculatePreview(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionRuleDto
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // @Get('status')
  // @Roles('Admin')
  // checkStatus() {
  //   return this.service.checkRulesStatus();
  // }

  // @Post('preview-commission')
  // @Roles('Admin')
  // async previewCommission(@Body() dto: PreviewCommissionDto) {
  //   return this.service.previewCommission(dto);
  // }

  // @Post('create-default/:programId')
  // @Roles('Admin')
  // async createDefaultRules(@Param('programId', ParseIntPipe) programId: number) {
  //   return this.service.createDefaultRules(programId);
  // }
}
