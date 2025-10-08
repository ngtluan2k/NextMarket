import { Test, TestingModule } from '@nestjs/testing';
import { GroupOrdersService } from './group_orders.service';

describe('GroupOrdersService', () => {
  let service: GroupOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupOrdersService],
    }).compile();

    service = module.get<GroupOrdersService>(GroupOrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
