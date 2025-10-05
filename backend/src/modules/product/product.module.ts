import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
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
import { StoreModule } from '../store/store.module';
import { ProductTag } from '../product_tag/product_tag.entity';
import { Tag } from '../tag/tag.entity';
import { ProductReview } from '../product_reviews/product_review.entity';
import { ProductReviewsModule } from '../product_reviews/product_reviews.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Store,
      ProductMedia,
      Variant,
      Inventory,
      PricingRules,
      ProductCategory,
      ProductTag,
      Tag,
      ProductReview,
    ]),
    forwardRef(() => ProductMediaModule),
    forwardRef(() => VariantModule),
    forwardRef(() => InventoryModule),
    forwardRef(() => PricingRuleModule),
    forwardRef(() => ProductCategoryModule),
    forwardRef(() => StoreModule),
    forwardRef(() => ProductReviewsModule), // Để products có thể liên kết reviews
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductPublishService],
  exports: [ProductService, ProductPublishService],
})
export class ProductModule {}
