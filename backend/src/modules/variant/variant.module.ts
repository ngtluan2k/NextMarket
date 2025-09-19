import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Variant } from './variant.entity';
import { VariantService } from './variant.service';
import { Product } from '../product/product.entity';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Variant, Product]), // Khai báo cả entity Variant và Product
    forwardRef(() => ProductModule), // Nếu VariantService cần ProductService
  ],
  providers: [VariantService],
  exports: [VariantService],
})
export class VariantModule {}
