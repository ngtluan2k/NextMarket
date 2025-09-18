import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { ShoppingCart } from './shopping_cart.entity';
import { CartItem } from './cart_item.entity';
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
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'items.product.media'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        uuid: uuidv4(),
        user, // ✅ gán full entity User
        items: [],
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
      where: { cart: { id: cart.id }, product: { id: productId } },
      relations: ['cart', 'product'],
    });

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cartItem = this.cartItemRepository.create({
        uuid: uuidv4(),
        cart,
        product,
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

    const result = await this.cartItemRepository.delete({
      cart: { id: cart.id },
      product: { id: productId },
    });

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
      where: { cart: { id: cart.id }, product: { id: productId } },
      relations: ['cart', 'product'],
    });

    if (!cartItem) {
      throw new NotFoundException('Mục giỏ hàng không tìm thấy');
    }

    cartItem.quantity = quantity;
    return this.cartItemRepository.save(cartItem);
  }
}
