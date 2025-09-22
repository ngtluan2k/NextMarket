import { Test, TestingModule } from '@nestjs/testing';
import { ShippingLabelsController } from './shipping-labels.controller';
import { ShippingLabelsService } from './shipping-labels.service';

describe('ShippingLabelsController', () => {
  let controller: ShippingLabelsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingLabelsController],
      providers: [ShippingLabelsService],
    }).compile();

    controller = module.get<ShippingLabelsController>(ShippingLabelsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
