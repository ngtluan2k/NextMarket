import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { AffiliatePlatformService } from './affiliate-platform.service';
import { CreateAffiliatePlatformDto } from './dto/create-affiliate-platform.dto';
import { UpdateAffiliatePlatformDto } from './dto/update-affiliate-platform.dto';
import { AffiliatePlatform } from './affiliate-platform.entity';

@Controller('affiliate-platforms')
export class AffiliatePlatformController {
  constructor(private readonly platformService: AffiliatePlatformService) {}

  @Get()
  findAll(): Promise<AffiliatePlatform[]> {
    return this.platformService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<AffiliatePlatform> {
    const platform = await this.platformService.findById(id);
    if (!platform) {
      throw new NotFoundException(`Affiliate platform with id ${id} not found`);
    }
    return platform;
  }

  @Post()
  create(@Body() dto: CreateAffiliatePlatformDto): Promise<AffiliatePlatform> {
    return this.platformService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() dto: UpdateAffiliatePlatformDto,
  ): Promise<AffiliatePlatform> {
    return this.platformService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.platformService.remove(id);
    return { message: `Affiliate platform ${id} deleted successfully` };
  }
}
