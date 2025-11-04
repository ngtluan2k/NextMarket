import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { StoreFollower } from './../store-follower/store-follower.entity';
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
import { ProductModule } from '../product/product.module';
import { Product } from '../product/product.entity';
import { Inventory } from '../inventory/inventory.entity';
import { Variant } from '../variant/variant.entity';
import { ProductMedia } from '../product_media/product_media.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { ProductCategory } from '../product_category/product_category.entity';
import { ProductTag } from '../product_tag/product_tag.entity';
import { Tag } from '../tag/tag.entity';
import { CampaignStore } from '../campaigns/entities/campaign_stores.ts.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      StoreFollower,
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
      Inventory,
      Variant,
      ProductMedia,
      PricingRules,
      ProductCategory,
      ProductTag,
      Tag,
      CampaignStore,
      Campaign,
    ]),
    forwardRef(() => ProductModule), // ✅ chỉ import module bằng forwardRef
  ],
  providers: [StoreService],
  controllers: [StoreController],
  exports: [StoreService],
})
export class StoreModule {}
