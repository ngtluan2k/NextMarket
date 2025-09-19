import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { StoreFollower } from './../store-follower/store-follower.entity';
import { StoreRating } from './../store-rating/store-rating.entity';
import { StoreDocument } from './../store-document/store-document.entity';
import { StoreBankAccount } from './../store-bank-account/store-bank-account.entity';
import { Payout } from './../payout/payout.entity';
import { StoreLevel } from './../store-level/store-level.entity';
import { StoreAddress } from './../store-address/store-address.entity';
import { StoreUpgradeRequest } from './../store-upgrade-request/store-upgrade-request.entity';
import { StoreInformation } from './../store-information/store-information.entity';
import { StoreInformationEmail } from './../store-information-email/store-information-email.entity';
import { StoreIdentification } from './../store-identification/store-identification.entity';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';
import { UserRole } from '../user-role/user-role.entity';
import { Product } from '../product/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      StoreFollower,
      StoreRating,
      StoreDocument,
      StoreBankAccount,
      Payout,
      StoreLevel,
      StoreAddress,
      StoreUpgradeRequest,
      StoreInformation,
      StoreInformationEmail,
      StoreIdentification,
      User,
      Role,
      UserRole,
      Product,
    ])
  ],
  providers: [StoreService],
  controllers: [StoreController],
  exports: [StoreService],
})
export class StoreModule {}