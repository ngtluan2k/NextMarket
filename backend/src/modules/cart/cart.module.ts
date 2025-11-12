import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingCart, CartItem } from './cart.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRuleModule } from '../pricing-rule/pricing-rule.module';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingCart, CartItem, Product, User, Variant, PricingRules]),
    forwardRef(() => PricingRuleModule),
  ],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
