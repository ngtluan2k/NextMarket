import { Injectable } from '@nestjs/common';
import { CreateSubscriptionUsageDto } from './dto/create-subscription_usage.dto';
import { UpdateSubscriptionUsageDto } from './dto/update-subscription_usage.dto';

@Injectable()
export class SubscriptionUsagesService {
  create(createSubscriptionUsageDto: CreateSubscriptionUsageDto) {
    return 'This action adds a new subscriptionUsage';
  }

  findAll() {
    return `This action returns all subscriptionUsages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} subscriptionUsage`;
  }

  update(id: number, updateSubscriptionUsageDto: UpdateSubscriptionUsageDto) {
    return `This action updates a #${id} subscriptionUsage`;
  }

  remove(id: number) {
    return `This action removes a #${id} subscriptionUsage`;
  }
}
