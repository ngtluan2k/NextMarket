import { Test, TestingModule } from '@nestjs/testing';
import { PricingRuleController } from './pricing-rule.controller';
import { PricingRuleService } from './pricing-rule.service';

describe('PricingRuleController', () => {
  let controller: PricingRuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingRuleController],
      providers: [PricingRuleService],
    }).compile();

    controller = module.get<PricingRuleController>(PricingRuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
