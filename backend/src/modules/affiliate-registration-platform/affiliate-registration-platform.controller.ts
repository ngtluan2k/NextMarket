import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { AffiliateRegistrationPlatformService } from './affiliate-registration-platform.service';
import { AffiliateRegistrationPlatform } from './affiliate-registration-platform.entity';

@Controller('affiliate-registration-platforms')
export class AffiliateRegistrationPlatformController {
  constructor(private readonly service: AffiliateRegistrationPlatformService) {}

  @Get()
  async findAll(): Promise<AffiliateRegistrationPlatform[]> {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() body: Partial<AffiliateRegistrationPlatform>) {
    return this.service.create(body);
  }

  @Delete(':registrationId/:platformId')
  async remove(
    @Param('registrationId') registrationId: number,
    @Param('platformId') platformId: number
  ) {
    await this.service.remove(registrationId, platformId);
    return { message: 'Relation removed successfully' };
  }
}
