import { Test, TestingModule } from '@nestjs/testing';
import { GroupOrdersController } from './group_orders.controller';

describe('GroupOrdersController', () => {
  let controller: GroupOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupOrdersController],
    }).compile();

    controller = module.get<GroupOrdersController>(GroupOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
