import { Test, TestingModule } from '@nestjs/testing';
import { OrderInvoicesService } from './order-invoices.service';

describe('OrderInvoicesService', () => {
  let service: OrderInvoicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderInvoicesService],
    }).compile();

    service = module.get<OrderInvoicesService>(OrderInvoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
