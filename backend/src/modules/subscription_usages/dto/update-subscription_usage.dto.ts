import { PartialType } from '@nestjs/swagger';
import { CreateSubscriptionUsageDto } from './create-subscription_usage.dto';

export class UpdateSubscriptionUsageDto extends PartialType(
  CreateSubscriptionUsageDto
) {}
