import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductMedia } from './product-media.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductMedia])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
