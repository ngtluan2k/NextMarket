import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
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
    return await this.registrationService.findById(id);
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
    return await this.registrationService.update(id, body);
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
}
