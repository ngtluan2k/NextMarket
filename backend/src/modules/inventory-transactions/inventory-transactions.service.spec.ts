import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionsService } from './inventory-transactions.service';

describe('InventoryTransactionsService', () => {
  let service: InventoryTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryTransactionsService],
    }).compile();

    service = module.get<InventoryTransactionsService>(
      InventoryTransactionsService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
