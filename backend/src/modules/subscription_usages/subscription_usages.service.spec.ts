import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionUsagesService } from './subscription_usages.service';

describe('SubscriptionUsagesService', () => {
  let service: SubscriptionUsagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubscriptionUsagesService],
    }).compile();

    service = module.get<SubscriptionUsagesService>(SubscriptionUsagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
