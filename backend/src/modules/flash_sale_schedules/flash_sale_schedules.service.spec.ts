import { Test, TestingModule } from '@nestjs/testing';
import { FlashSaleSchedulesService } from './flash_sale_schedules.service';

describe('FlashSaleSchedulesService', () => {
  let service: FlashSaleSchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlashSaleSchedulesService],
    }).compile();

    service = module.get<FlashSaleSchedulesService>(FlashSaleSchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
