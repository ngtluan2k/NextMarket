import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PricingRulesService } from './pricing-rule.service';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { Req } from '@nestjs/common';
@Controller('pricing-rule')
export class PricingRuleController {
  constructor(private readonly pricingRulesService: PricingRulesService) {}

  @Post()
  async add(@Body() dto: CreatePricingRuleDto, @Req() req: any) {
    const userId = req.user.id;
    return this.pricingRulesService.addPricingRule(dto, userId);
  }
}
