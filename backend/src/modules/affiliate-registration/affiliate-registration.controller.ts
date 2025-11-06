import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { AffiliateRegistrationService } from './affiliate-registration.service';
import { AffiliateRegistration } from './affiliate-registration.entity';

@Controller('affiliate-registrations')
export class AffiliateRegistrationController {
  constructor(
    private readonly registrationService: AffiliateRegistrationService
  ) {}

  @Get()
  async findAll(): Promise<AffiliateRegistration[]> {
    return await this.registrationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<AffiliateRegistration> {
    const registration = await this.registrationService.findById(id);
    if (!registration) {
      throw new NotFoundException(`Affiliate registration with ID ${id} not found`);
    }
    return registration;
  }

  @Post()
  async create(
    @Body() body: Partial<AffiliateRegistration>
  ): Promise<AffiliateRegistration> {
    return await this.registrationService.create(body);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() body: Partial<AffiliateRegistration>
  ): Promise<AffiliateRegistration> {
    const registration = await this.registrationService.update(id, body);
    if (!registration) {
      throw new NotFoundException(`Affiliate registration with ID ${id} not found`);
    }
    return registration;
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.registrationService.remove(id);
    return { message: `Affiliate registration ${id} deleted successfully` };
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: number): Promise<AffiliateRegistration> {
    return await this.registrationService.approveRegistration(id);
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: number): Promise<AffiliateRegistration> {
    return await this.registrationService.rejectRegistration(id);
  }

  @Post('fix-affiliate-codes')
  async fixAffiliateCodes(): Promise<{ message: string }> {
    await this.registrationService.fixAffiliateUsersWithoutCodes();
    return { message: 'Fixed affiliate users without codes successfully' };
  }
}
