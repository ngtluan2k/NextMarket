import { Test, TestingModule } from '@nestjs/testing';
import { ShippingLabelsService } from './shipping-labels.service';

describe('ShippingLabelsService', () => {
  let service: ShippingLabelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShippingLabelsService],
    }).compile();

    service = module.get<ShippingLabelsService>(ShippingLabelsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
