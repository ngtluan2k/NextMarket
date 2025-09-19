import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { ShoppingCart } from './shopping_cart.entity';
import { CartItem } from './cart_item.entity';
@Module({
  imports: [TypeOrmModule.forFeature([ShoppingCart, CartItem, Product, User])],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
