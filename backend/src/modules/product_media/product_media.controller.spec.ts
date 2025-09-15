import { Test, TestingModule } from '@nestjs/testing';
import { ProductMediaController } from './product_media.controller';
import { ProductMediaService } from './product_media.service';

describe('ProductMediaController', () => {
  let controller: ProductMediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductMediaController],
      providers: [ProductMediaService],
    }).compile();

    controller = module.get<ProductMediaController>(ProductMediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
