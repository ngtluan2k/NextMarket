import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { AffiliateRootTrackingService } from '../service/affiliate-root-tracking.service';
import { CreateAffiliateRootDto } from '../dto/create-affiliate-root.dto';
import { UpdateAffiliateRootDto } from '../dto/update-affiliate-root.dto';
import { AffiliateRootTracking } from '../dto/affiliate-root-tracking.entity';

@Controller('affiliate-root')
export class AffiliateRootTrackingController {
  constructor(
    private readonly affiliateRootService: AffiliateRootTrackingService,
  ) {}

  @Post()
  create(@Body() dto: CreateAffiliateRootDto): Promise<AffiliateRootTracking> {
    return this.affiliateRootService.create(dto);
  }

  @Get()
  findAll(): Promise<AffiliateRootTracking[]> {
    return this.affiliateRootService.findAll();
  }

  @Get('active')
  findActiveRoot(): Promise<AffiliateRootTracking> {
    return this.affiliateRootService.findActiveRoot();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AffiliateRootTracking> {
    return this.affiliateRootService.findOne(id);
  }

  @Get('uuid/:uuid')
  findByUuid(@Param('uuid') uuid: string): Promise<AffiliateRootTracking> {
    return this.affiliateRootService.findByUuid(uuid);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAffiliateRootDto,
  ): Promise<AffiliateRootTracking> {
    return this.affiliateRootService.update(id, dto);
  }

  @Put(':id/set-active')
  setActiveRoot(@Param('id', ParseIntPipe) id: number): Promise<AffiliateRootTracking> {
    return this.affiliateRootService.setActiveRoot(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.affiliateRootService.remove(id);
  }
}