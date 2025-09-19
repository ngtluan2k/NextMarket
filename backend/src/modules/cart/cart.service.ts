import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart, CartItem } from './cart.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
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
    @InjectRepository(Variant)
    private variantRepository: Repository<Variant>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async getOrCreateCart(userId: number): Promise<ShoppingCart> {
    let cart = await this.cartRepository.findOne({
      where: { user_id: userId },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.product.media',
      ],
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
    quantity = 1,
    variantId?: number
  ): Promise<CartItem> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Sản phẩm không tìm thấy');
    }

    let variant: Variant | null = null;
    if (variantId) {
      variant = await this.variantRepository.findOne({
        where: { id: variantId },
      });
      if (!variant) {
        throw new NotFoundException('Biến thể không tìm thấy');
      }
      if ((variant.stock ?? 0) < quantity) {
        throw new NotFoundException('Không đủ hàng trong kho');
      }
    } else if ((product.base_price ?? 0) < quantity) {
      throw new NotFoundException('Không đủ hàng trong kho');
    }

    const cart = await this.getOrCreateCart(userId);

    let cartItem = await this.cartItemRepository.findOne({
      where: {
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId ?? undefined,
      },
    });

    if (cartItem) {
      if (variant && cartItem.quantity + quantity > (variant.stock ?? 0)) {
        throw new NotFoundException('Không đủ hàng trong kho');
      } else if (
        !variant &&
        cartItem.quantity + quantity > (product.base_price ?? 0)
      ) {
        throw new NotFoundException('Không đủ hàng trong kho');
      }
      cartItem.quantity += quantity;
    } else {
      cartItem = this.cartItemRepository.create({
        uuid: uuidv4(),
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId ?? undefined,
        quantity,
        price: variant ? variant.price : product.base_price,
        added_at: new Date(),
      });
    }

    return this.cartItemRepository.save(cartItem);
  }

  async getCart(userId: number): Promise<CartItem[]> {
    const cart = await this.getOrCreateCart(userId);
    return this.cartItemRepository.find({
      where: { cart_id: cart.id },
      relations: ['product', 'variant', 'product.media'],
    });
  }

  async removeFromCart(
    userId: number,
    productId: number,
  ): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    const result = await this.cartItemRepository.delete({
      cart_id: cart.id,
      product_id: productId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Mục giỏ hàng không tìm thấy');
    }
  }

  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    variantId?: number
  ): Promise<CartItem> {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId ?? undefined,
      },
    });
    if (!cartItem) {
      throw new NotFoundException('Mục giỏ hàng không tìm thấy');
    }
    if (variantId) {
      const variant = await this.variantRepository.findOne({
        where: { id: variantId },
      });
      if (variant && quantity > (variant.stock ?? 0)) {
        throw new NotFoundException('Không đủ hàng trong kho');
      }
    } else {
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });
      if (product && quantity > (product.base_price ?? 0)) {
        throw new NotFoundException('Không đủ hàng trong kho');
      }
    }
    cartItem.quantity = quantity;
    return this.cartItemRepository.save(cartItem);
  }

  async clearCart(userId: number): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.delete({ cart_id: cart.id });
  }
}
