import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCategory } from './product_category.entity';
import { ProductCategoryService } from './product_category.service';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductCategory, Product]),
    forwardRef(() => ProductModule), // nếu cần dùng ProductService
  ],
  providers: [ProductCategoryService],
  exports: [ProductCategoryService],
})
export class ProductCategoryModule {}
