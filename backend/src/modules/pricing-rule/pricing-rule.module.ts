import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingRulesService } from './pricing-rule.service';
import { PricingRuleController } from './pricing-rule.controller';
import { PricingRules } from './pricing-rule.entity';
import { ProductModule } from '../product/product.module';
import { Product } from '../product/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PricingRules, Product]), // cần Product để inject ProductRepository
    forwardRef(() => ProductModule), // nếu PricingRulesService dùng ProductService
  ],
  providers: [PricingRulesService],
  controllers: [PricingRuleController],
  exports: [PricingRulesService],
})
export class PricingRuleModule {}
