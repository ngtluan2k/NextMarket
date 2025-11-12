import { Test, TestingModule } from '@nestjs/testing';
import { VoucherCollectionService } from './voucher-collection.service';

describe('VoucherCollectionService', () => {
  let service: VoucherCollectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoucherCollectionService],
    }).compile();

    service = module.get<VoucherCollectionService>(VoucherCollectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
