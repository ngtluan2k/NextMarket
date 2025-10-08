import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SubscriptionUsagesService } from './subscription_usages.service';
import { CreateSubscriptionUsageDto } from './dto/create-subscription_usage.dto';
import { UpdateSubscriptionUsageDto } from './dto/update-subscription_usage.dto';

@Controller('subscription-usages')
export class SubscriptionUsagesController {
  constructor(
    private readonly subscriptionUsagesService: SubscriptionUsagesService
  ) {}

  @Post()
  create(@Body() createSubscriptionUsageDto: CreateSubscriptionUsageDto) {
    return this.subscriptionUsagesService.create(createSubscriptionUsageDto);
  }

  @Get()
  findAll() {
    return this.subscriptionUsagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionUsagesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionUsageDto: UpdateSubscriptionUsageDto
  ) {
    return this.subscriptionUsagesService.update(
      +id,
      updateSubscriptionUsageDto
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionUsagesService.remove(+id);
  }
}
