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
import { Brand } from '../brands/brand.entity';
import { ProductReview } from '../product_reviews/product_review.entity';
import { ProductReviewsModule } from '../product_reviews/product_reviews.module';
import { OrderItem } from '../order-items/order-item.entity';
import { FlashSaleSchedule } from '../flash_sale_schedules/entities/flash_sale_schedule.entity';
import { FlashSaleSchedulesModule } from '../flash_sale_schedules/flash_sale_schedules.module';
import { Order } from '../orders/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Store,
      Brand,
      ProductMedia,
      Variant,
      Inventory,
      PricingRules,
      ProductCategory,
      ProductTag,
      Tag,
      ProductReview,
      OrderItem,
      FlashSaleSchedule,
      Order
    ]),
    forwardRef(() => ProductMediaModule),
    forwardRef(() => VariantModule),
    forwardRef(() => InventoryModule),
    forwardRef(() => PricingRuleModule),
    forwardRef(() => ProductCategoryModule),
    forwardRef(() => StoreModule),
    forwardRef(() => ProductReviewsModule),
    forwardRef(()  => FlashSaleSchedulesModule)
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductPublishService],
  exports: [ProductService, ProductPublishService],
})
export class ProductModule {}
