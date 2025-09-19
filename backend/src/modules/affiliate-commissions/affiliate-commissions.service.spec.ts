import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateCommissionsService } from './affiliate-commissions.service';

describe('AffiliateCommissionsService', () => {
  let service: AffiliateCommissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AffiliateCommissionsService],
    }).compile();

    service = module.get<AffiliateCommissionsService>(
      AffiliateCommissionsService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
