import { Test, TestingModule } from '@nestjs/testing';
import { OrderInvoicesController } from './order-invoices.controller';
import { OrderInvoicesService } from './order-invoices.service';

describe('OrderInvoicesController', () => {
  let controller: OrderInvoicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderInvoicesController],
      providers: [OrderInvoicesService],
    }).compile();

    controller = module.get<OrderInvoicesController>(OrderInvoicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
