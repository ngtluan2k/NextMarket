import { Module } from '@nestjs/common';
import { SubscriptionUsagesService } from './subscription_usages.service';
import { SubscriptionUsagesController } from './subscription_usages.controller';

@Module({
  controllers: [SubscriptionUsagesController],
  providers: [SubscriptionUsagesService],
})
export class SubscriptionUsagesModule {}
