import { Test, TestingModule } from '@nestjs/testing';
import { FlashSaleSchedulesController } from './flash_sale_schedules.controller';
import { FlashSaleSchedulesService } from './flash_sale_schedules.service';

describe('FlashSaleSchedulesController', () => {
  let controller: FlashSaleSchedulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashSaleSchedulesController],
      providers: [FlashSaleSchedulesService],
    }).compile();

    controller = module.get<FlashSaleSchedulesController>(
      FlashSaleSchedulesController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
