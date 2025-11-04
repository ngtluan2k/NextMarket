import { Test, TestingModule } from '@nestjs/testing';
import { VoucherCollectionController } from './voucher-collection.controller';
import { VoucherCollectionService } from './voucher-collection.service';

describe('VoucherCollectionController', () => {
  let controller: VoucherCollectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoucherCollectionController],
      providers: [VoucherCollectionService],
    }).compile();

    controller = module.get<VoucherCollectionController>(
      VoucherCollectionController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
