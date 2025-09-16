import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './inventory.entity';
import { InventoryService } from './inventory.service';
import { ProductModule } from '../product/product.module';
import { VariantModule } from '../variant/variant.module';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, Product, Variant]), // <-- phải có Inventory ở đây
    forwardRef(() => ProductModule),
    forwardRef(() => VariantModule),
  ],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
