import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionUsagesController } from './subscription_usages.controller';
import { SubscriptionUsagesService } from './subscription_usages.service';

describe('SubscriptionUsagesController', () => {
  let controller: SubscriptionUsagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionUsagesController],
      providers: [SubscriptionUsagesService],
    }).compile();

    controller = module.get<SubscriptionUsagesController>(
      SubscriptionUsagesController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
