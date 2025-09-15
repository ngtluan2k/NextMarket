import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductMedia } from './product-media.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Store } from '../store/store.entity';
import { ProductPublishService } from './product-publish.service';
import { ProductMedia } from '../product_media/product_media.entity';
import { ProductMediaModule } from '../product_media/product_media.module';
import { Variant } from '../variant/variant.entity';
import { VariantModule } from '../variant/variant.module';
import { Inventory } from '../inventory/inventory.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { PricingRuleModule } from '../pricing-rule/pricing-rule.module';
import { ProductCategory } from '../product_category/product_category.entity';
import { ProductCategoryModule } from '../product_category/product_category.module';

@Module({
<<<<<<< HEAD
  imports: [TypeOrmModule.forFeature([Product, ProductMedia])],
=======
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Store,
      ProductMedia,
      Variant,
      Inventory,
      PricingRules,
      ProductCategory,
    ]),
    forwardRef(() => ProductMediaModule),
    forwardRef(() => VariantModule),
    forwardRef(() => InventoryModule),
    forwardRef(() => PricingRuleModule),
    forwardRef(() => ProductCategoryModule),
  ],
>>>>>>> a7ed62425b572e13be474147b8ed61db58b15377
  controllers: [ProductController],
  providers: [ProductService, ProductPublishService],
  exports: [ProductService, ProductPublishService],
})
export class ProductModule {}
