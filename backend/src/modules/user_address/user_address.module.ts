// src/user-address/user-address.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';     
import { HttpModule } from '@nestjs/axios';             
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserAddress } from './user_address.entity';
import { UserAddressService } from './user_address.service';
import { UserAddressController } from './user_address.controller';
import { GhnMappingService } from '../../services/ghn-mapping.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAddress]),

    CacheModule.register({
      isGlobal: false, 
      ttl: 300,       
      max: 100,        
    }),

    // HttpModule từ @nestjs/axios (có thể để gọi GHN API)
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [UserAddressController],
  providers: [UserAddressService, GhnMappingService],
  exports: [UserAddressService],
})
export class UserAddressModule {}