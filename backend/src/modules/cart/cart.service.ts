import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart, CartItem } from './cart.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(ShoppingCart)
    private cartRepository: Repository<ShoppingCart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async getOrCreateCart(userId: number): Promise<ShoppingCart> {
    let cart = await this.cartRepository.findOne({
      where: { user_id: userId },
      relations: ['items', 'items.product', 'items.product.media'],
    });
    if (!cart) {
      cart = this.cartRepository.create({
        uuid: uuidv4(),
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  async addToCart(
    userId: number,
    productId: number,
    quantity = 1
  ): Promise<CartItem> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tìm thấy');
    }

    const cart = await this.getOrCreateCart(userId);

    let cartItem = await this.cartItemRepository.findOne({
      where: { cart_id: cart.id, product_id: productId },
    });

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = this.cartItemRepository.create({
        uuid: uuidv4(),
        cart_id: cart.id,
        product_id: productId,
        quantity,
        price: product.base_price,
        added_at: new Date(),
      });
    }

    return this.cartItemRepository.save(cartItem);
  }

  async getCart(userId: number): Promise<CartItem[]> {
    const cart = await this.getOrCreateCart(userId);
    return cart.items;
  }

  async removeFromCart(userId: number, productId: number): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    const result = await this.cartItemRepository.delete({ cart_id: cart.id, product_id: productId });
    if (result.affected === 0) {
      throw new NotFoundException('Mục giỏ hàng không tìm thấy');
    }
  }

  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number
  ): Promise<CartItem> {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: { cart_id: cart.id, product_id: productId },
    });
    if (!cartItem) {
      throw new NotFoundException('Mục giỏ hàng không tìm thấy');
    }
    cartItem.quantity = quantity;
    return this.cartItemRepository.save(cartItem);
  }
}
