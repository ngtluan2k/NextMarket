import { Test, TestingModule } from '@nestjs/testing';
import { OrderShipmentsController } from './order-shipments.controller';
import { OrderShipmentsService } from './order-shipments.service';

describe('OrderShipmentsController', () => {
  let controller: OrderShipmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderShipmentsController],
      providers: [OrderShipmentsService],
    }).compile();

    controller = module.get<OrderShipmentsController>(OrderShipmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
