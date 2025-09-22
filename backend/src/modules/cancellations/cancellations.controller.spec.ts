import { Test, TestingModule } from '@nestjs/testing';
import { CancellationsController } from './cancellations.controller';
import { CancellationsService } from './cancellations.service';

describe('CancellationsController', () => {
  let controller: CancellationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CancellationsController],
      providers: [CancellationsService],
    }).compile();

    controller = module.get<CancellationsController>(CancellationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
