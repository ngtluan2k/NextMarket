import { Test, TestingModule } from '@nestjs/testing';
import { UserAddressController } from './user_address.controller';
import { UserAddressService } from './user_address.service';

describe('UserAddressController', () => {
  let controller: UserAddressController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAddressController],
      providers: [UserAddressService],
    }).compile();

    controller = module.get<UserAddressController>(UserAddressController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
