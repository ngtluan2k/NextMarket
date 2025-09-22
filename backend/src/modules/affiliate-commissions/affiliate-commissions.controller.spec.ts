import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateCommissionsController } from './affiliate-commissions.controller';
import { AffiliateCommissionsService } from './affiliate-commissions.service';

describe('AffiliateCommissionsController', () => {
  let controller: AffiliateCommissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffiliateCommissionsController],
      providers: [AffiliateCommissionsService],
    }).compile();

    controller = module.get<AffiliateCommissionsController>(
      AffiliateCommissionsController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
