import { Module } from '@nestjs/common';
import { UserAddressService } from './user_address.service';
import { UserAddressController } from './user_address.controller';

@Module({
  controllers: [UserAddressController],
  providers: [UserAddressService],
})
export class UserAddressModule {}
