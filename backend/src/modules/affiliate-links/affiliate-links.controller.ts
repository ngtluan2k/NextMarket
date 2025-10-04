import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AffiliateLinksService } from './affiliate-links.service';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';
import { UpdateAffiliateLinkDto } from './dto/update-affiliate-link.dto';

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
}