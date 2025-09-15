import { Test, TestingModule } from '@nestjs/testing';
import { PricingRulesService } from './pricing-rule.service';

describe('PricingRuleService', () => {
  let service: PricingRulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingRulesService],
    }).compile();

    service = module.get<PricingRulesService>(PricingRulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
