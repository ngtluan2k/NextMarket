import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AffiliateCommissionsService } from './affiliate-commissions.service';
import { CreateAffiliateCommissionDto } from './dto/create-affiliate-commission.dto';
import { UpdateAffiliateCommissionDto } from './dto/update-affiliate-commission.dto';

@Controller('affiliate-commissions')
export class AffiliateCommissionsController {
  constructor(
    private readonly affiliateCommissionsService: AffiliateCommissionsService
  ) {}

  @Post()
  create(@Body() createAffiliateCommissionDto: CreateAffiliateCommissionDto) {
    return this.affiliateCommissionsService.create(
      createAffiliateCommissionDto
    );
  }

  @Get()
  findAll() {
    return this.affiliateCommissionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.affiliateCommissionsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAffiliateCommissionDto: UpdateAffiliateCommissionDto
  ) {
    return this.affiliateCommissionsService.update(
      +id,
      updateAffiliateCommissionDto
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.affiliateCommissionsService.remove(+id);
  }
}
