import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart, CartItem } from './cart.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
import { User } from '../user/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { PricingRulesService } from '../pricing-rule/pricing-rule.service';

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
    private userRepository: Repository<User>,
    private pricingRulesService: PricingRulesService
  ) {}

  async getOrCreateCart(userId: number): Promise<ShoppingCart> {
    let cart = await this.cartRepository.findOne({
      where: { user_id: userId },
      relations: [
        'items',
        'items.product',
        'items.product.variants',
        'items.product.variants.inventories',
        'items.product.media',
        'items.product.pricing_rules',
        'items.product.store',
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
      relations: ['pricing_rules'],
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

    cartItem.price = this.calculatePriceWithRulesForItem(
      product,
      variant,
      cartItem.quantity
    );

    return this.cartItemRepository.save(cartItem);
  }

  async getCart(userId: number): Promise<any> {
    const cart = await this.getOrCreateCart(userId);

    // Tối ưu response: Chỉ return fields cần thiết, chỉ lấy media của variant đã add
const optimizedItems = cart.items.map((item) => {
  const calculatedPrice = this.calculatePriceWithRules(item);

  return {
    id: item.id,
    uuid: item.uuid,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    price: calculatedPrice,
    added_at: item.added_at,
    // 🔹 Trả nguyên cục product luôn
    product: item.product,
    variant: item.variant ?? null,
  };
});

    return {
      id: cart.id,
      uuid: cart.uuid,
      user_id: cart.user_id,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
      items: optimizedItems,
    };
  }

async removeFromCart(
  userId: number,
  productId: number,
  variantId?: number
): Promise<void> {
  const cart = await this.getOrCreateCart(userId);

  // Tạo điều kiện xóa linh hoạt
  const whereCondition: any = {
    cart_id: cart.id,
    product_id: productId,
  };

  if (variantId !== undefined) {
    whereCondition.variant_id = variantId;
  }

  const result = await this.cartItemRepository.delete(whereCondition);

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
      relations: ['product', 'product.pricing_rules', 'variant'],
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
    cartItem.price = this.calculatePriceWithRulesForItem(
      cartItem.product,
      cartItem.variant,
      quantity
    );
    return this.cartItemRepository.save(cartItem);
  }

  async clearCart(userId: number): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.delete({ cart_id: cart.id });
  }

  private calculatePriceWithRules(item: CartItem): number {
    const product = item.product;
    if (!product) {
      return 0; // Or handle as an error
    }

    let currentPrice = item.variant
      ? Number(item.variant.price)
      : Number(product.base_price);

    const now = new Date();
    const validRules = (product.pricing_rules ?? [])
      .filter((rule) => {
        const startsAt = rule.starts_at
          ? new Date(rule.starts_at)
          : new Date(0);
        const endsAt = rule.ends_at
          ? new Date(rule.ends_at)
          : new Date(8640000000000000);
        const minQuantity = rule.min_quantity ?? 0;
        return item.quantity >= minQuantity && now >= startsAt && now <= endsAt;
      })
      .sort((a, b) => (b.min_quantity ?? 0) - (a.min_quantity ?? 0));

    if (validRules.length > 0) {
      const bestRule = validRules[0];
      currentPrice = Number(bestRule.price);
    }
    return currentPrice;
  }

  private calculatePriceWithRulesForItem(
    product: Product,
    variant: Variant | null,
    quantity: number
  ): number {
    let currentPrice = variant
      ? Number(variant.price)
      : Number(product.base_price);

    const now = new Date();
    const validRules = (product.pricing_rules ?? [])
      .filter((rule) => {
        const startsAt = rule.starts_at
          ? new Date(rule.starts_at)
          : new Date(0);
        const endsAt = rule.ends_at
          ? new Date(rule.ends_at)
          : new Date(8640000000000000);
        const minQuantity = rule.min_quantity ?? 0;
        return quantity >= minQuantity && now >= startsAt && now <= endsAt;
      })
      .sort((a, b) => (b.min_quantity ?? 0) - (a.min_quantity ?? 0));

    if (validRules.length > 0) {
      const bestRule = validRules[0];
      currentPrice = Number(bestRule.price);
    }
    return currentPrice;
  }
}
