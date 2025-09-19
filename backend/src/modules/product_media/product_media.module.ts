import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMedia } from './product_media.entity';
import { ProductMediaService } from './product_media.service';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductMedia, Product]), // bắt buộc khai báo entity
    forwardRef(() => ProductModule), // nếu ProductMediaService cần ProductService
  ],
  providers: [ProductMediaService],
  exports: [ProductMediaService],
})
export class ProductMediaModule {}
