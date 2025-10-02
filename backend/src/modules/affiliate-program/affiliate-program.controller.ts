import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AffiliateProgramsService } from './affiliate-program.service';
import { CreateAffiliateProgramDto } from './dto/create-affiliate-program.dto';
import { UpdateAffiliateProgramDto } from './dto/update-affiliate-program.dto';

@Controller('affiliate-programs')
export class AffiliateProgramsController {
  constructor(private readonly service: AffiliateProgramsService) {}

  @Post()
  create(@Body() createDto: CreateAffiliateProgramDto) {
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
  update(@Param('id') id: string, @Body() updateDto: UpdateAffiliateProgramDto) {
    return this.service.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}