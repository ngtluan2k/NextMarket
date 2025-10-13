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
        'items.variant',
        'items.product.media',
        'items.product.pricing_rules',
        'items.product.store',
        'items.product.pricing_rules.variant',
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
    variantId?: number,
    type?: 'bulk' | 'subscription',
    isGroup = false
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
        type,
        is_group: isGroup,
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
        type,
        is_group: isGroup,
        added_at: new Date(),
      });
    }

    cartItem.price = this.calculatePriceWithRulesForItem(
      product,
      variant,
      cartItem.quantity,
      type
    );

    return this.cartItemRepository.save(cartItem);
  }

  async getCart(userId: number): Promise<any> {
    const cart = await this.getOrCreateCart(userId);

    const optimizedItems = cart.items.map((item) => {
      const calculatedPrice = this.calculatePriceWithRulesForItem(
        item.product,
        item.variant,
        item.quantity,
        item.type // dùng type để tính giá đúng
      );
      console.log(
        'Item type:',
        item.type,
        'Quantity:',
        item.quantity,
        'Variant:',
        item.variant
          ? `${item.variant.variant_name} (${item.variant.id})`
          : 'none',
        'Calculated price:',
        calculatedPrice
      );

      return {
        id: item.id,
        uuid: item.uuid,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: calculatedPrice,
        type: item.type ?? 'subscription',
        is_group: item.is_group,
        added_at: item.added_at,
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          short_description: item.product.short_description,
          base_price: item.product.base_price,
          store: item.product.store
            ? {
                id: item.product.store.id,
                name: item.product.store.name,
                slug: item.product.store.slug,
                logo_url: item.product.store.logo_url,
                email: item.product.store.email,
              }
            : null,
          media: item.product.media.filter(
            (media) =>
              media.is_primary &&
              (!item.variant_id || media.id === item.variant_id)
          ),
        },
        variant: item.variant
          ? {
              id: item.variant.id,
              variant_name: item.variant.variant_name,
              price: item.variant.price,
              stock: item.variant.stock,
            }
          : null,
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
    variantId?: number,
    type?: 'bulk' | 'subscription'
  ): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    const result = await this.cartItemRepository.delete({
      cart_id: cart.id,
      product_id: productId,
      variant_id: variantId ?? undefined,
      type,

    });
    if (result.affected === 0) {
      throw new NotFoundException('Mục giỏ hàng không tìm thấy');
    }
  }

  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    variantId?: number,
    type?: 'bulk' | 'subscription',
    isGroup?: boolean
  ): Promise<CartItem> {
    console.log('updateQuantity body:', {
      productId,
      quantity,
      variantId,
      type,
    });
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId ?? undefined,
        type,
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
    cartItem.type = type ?? cartItem.type; // lưu type vào cartItem
    cartItem.price = this.calculatePriceWithRulesForItem(
      cartItem.product,
      cartItem.variant,
      quantity,
      type // truyền type xuống để tính đúng giá
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
public calculatePriceWithRulesForItem(
  product: Product,
  variant: Variant | null,
  quantity: number,
  type: 'bulk' | 'subscription' = 'bulk'
): number {
  // Giá mặc định: variant.price nếu có, không thì base_price
  let currentPrice = variant ? Number(variant.price) : Number(product.base_price);
  const now = new Date();

  const validRules = (product.pricing_rules ?? []).filter(rule => {
    const startsAt = rule.starts_at ? new Date(rule.starts_at) : new Date(0);
    const endsAt = rule.ends_at ? new Date(rule.ends_at) : new Date(8640000000000000);
    const minQty = rule.min_quantity ?? 0;

    // chỉ áp dụng rule trong khoảng thời gian
    if (now < startsAt || now > endsAt) return false;

    // chỉ áp dụng nếu đúng type
    if (rule.type !== type) return false;

    // chỉ áp dụng nếu đúng variant (nếu rule gắn variant)
    if (rule.variant) {
      if (!variant || rule.variant.id !== variant.id) return false;
    }

    // kiểm tra quantity
    if (type === 'subscription') return quantity === minQty;
    return quantity >= minQty;
  });

  // chọn rule có min_quantity lớn nhất
  const bestRule = validRules.sort((a, b) => (b.min_quantity ?? 0) - (a.min_quantity ?? 0))[0];

  if (bestRule) currentPrice = Number(bestRule.price);

  return currentPrice;
}



}
