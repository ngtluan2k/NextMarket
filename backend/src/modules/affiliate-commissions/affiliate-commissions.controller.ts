import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AffiliateCommissionsService } from './affiliate-commissions.service';
import { CreateAffiliateCommissionDto } from './dto/create-affiliate-commission.dto';
import { UpdateAffiliateCommissionDto } from './dto/update-affiliate-commission.dto';

@Controller('affiliate-commissions')
export class AffiliateCommissionsController {
  constructor(private readonly service: AffiliateCommissionsService) {}

  @Post()
  create(@Body() createDto: CreateAffiliateCommissionDto) {
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
  update(@Param('id') id: string, @Body() updateDto: UpdateAffiliateCommissionDto) {
    return this.service.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}