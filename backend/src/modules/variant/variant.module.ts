import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Variant } from './variant.entity';
import { VariantService } from './variant.service';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';
import { ProductReview } from '../product_reviews/product_review.entity';
import { ProductReviewsModule } from '../product_reviews/product_reviews.module';
import { ProductMedia } from '../product_media/product_media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Variant, Product, ProductReview, ProductMedia]), // Thêm ProductMedia
    forwardRef(() => ProductModule),
  ],
  providers: [VariantService],
  exports: [VariantService],
})
export class VariantModule {}
