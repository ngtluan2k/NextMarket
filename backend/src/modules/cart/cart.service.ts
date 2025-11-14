import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart, CartItem } from './cart.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';
import { User } from '../user/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { PricingRulesService } from '../pricing-rule/pricing-rule.service';
import { OrderItem } from '../order-items/order-item.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(ShoppingCart)
    private cartRepository: Repository<ShoppingCart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(PricingRules)
    private pricingRuleRepository: Repository<PricingRules>,
    @InjectRepository(Variant)
    private variantRepository: Repository<Variant>,
    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,
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
    type: 'bulk' | 'subscription' | 'normal' | 'flash_sale' = 'normal',
    isGroup = false,
    pricingRuleId?: number
  ): Promise<CartItem> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['pricing_rules'],
    });
    if (!product) throw new NotFoundException('Sản phẩm không tìm thấy');

    let variant: Variant | null = null;
    if (variantId) {
      variant = await this.variantRepository.findOne({
        where: { id: variantId },
      });
      if (!variant) throw new NotFoundException('Biến thể không tìm thấy');
    }

    const cart = await this.getOrCreateCart(userId);

    // --- Tìm item trùng ---
    const where: any = {
      cart_id: cart.id,
      product_id: productId,
      variant_id: variantId ?? undefined,
      is_group: isGroup,
    };
    if (pricingRuleId != null) where.pricing_rule_id = pricingRuleId;

    const duplicateItems = await this.cartItemRepository.find({
      where: {
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId ?? undefined,
        is_group: isGroup,
      },
    });

    const sameGroup = duplicateItems.filter((i) => {
      if (
        ['bulk', 'normal'].includes(i.type) &&
        ['bulk', 'normal'].includes(type)
      ) {
        return true;
      }
      return i.type === type && i.pricing_rule_id === pricingRuleId;
    });

    let totalQuantity = quantity;
    let cartItem: CartItem;

    if (sameGroup.length > 0) {
      cartItem = sameGroup[0];

      // ✅ Cộng tất cả số lượng cũ + mới
      totalQuantity =
        sameGroup.reduce((sum, i) => sum + i.quantity, 0) + quantity;

      if (sameGroup.length > 1) {
        const toRemove = sameGroup.slice(1).map((i) => i.id);
        await this.cartItemRepository.delete(toRemove);
      }
    } else {
      // --- Tạo mới ---
      cartItem = this.cartItemRepository.create({
        uuid: uuidv4(),
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId ?? undefined,
        type,
        is_group: isGroup,
        added_at: new Date(),
      });
      totalQuantity = quantity;
    }

    // --- Kiểm tra tồn kho ---
    if (variant && totalQuantity > (variant.stock ?? 0)) {
      throw new BadRequestException('Không đủ hàng trong kho');
    }

    // --- Xử lý subscription ---
    if (type === 'subscription') {
      const subRule = (product.pricing_rules ?? []).find(
        (r) => r.type === 'subscription'
      );
      if (subRule) {
        cartItem.quantity = subRule.min_quantity ?? 1;
        cartItem.pricing_rule_id = subRule.id;
        cartItem.price = Number(subRule.price);
      } else {
        cartItem.quantity = 1;
        cartItem.pricing_rule_id = null;
        cartItem.price = variant?.price ?? Number(product.base_price ?? 0);
      }
    }

    // --- Gộp xử lý bulk và normal ---
    else if (type === 'bulk' || type === 'normal') {
      cartItem.quantity = totalQuantity;

      const bulkRules = (product.pricing_rules ?? []).filter(
        (r) => r.type === 'bulk'
      );
      let matchedRule: PricingRules | null = null;

      // Nếu là bulk thì tìm rule phù hợp, còn normal thì không ép buộc
      if (bulkRules.length > 0) {
        matchedRule =
          bulkRules
            .filter((r) => totalQuantity >= (r.min_quantity ?? 0))
            .sort((a, b) => (b.min_quantity ?? 0) - (a.min_quantity ?? 0))[0] ??
          null;
      }

      if (matchedRule) {
        cartItem.pricing_rule_id = matchedRule.id;
        cartItem.price = Number(matchedRule.price);
        cartItem.type = 'bulk';
      } else {
        cartItem.pricing_rule_id = null;
        cartItem.price = variant?.price ?? Number(product.base_price ?? 0);
        cartItem.type = 'normal';
      }
    }

    // --- Xử lý flash sale ---
    else if (type === 'flash_sale') {
      const flashRule = (product.pricing_rules ?? []).find(
        (r) => r.type === 'flash_sale'
      );
      if (flashRule) {
        if (
          flashRule.limit_quantity &&
          totalQuantity > flashRule.limit_quantity
        ) {
          cartItem.quantity = flashRule.limit_quantity;
        } else {
          cartItem.quantity = totalQuantity;
        }
        cartItem.pricing_rule_id = flashRule.id;
        cartItem.price = Number(flashRule.price);
      } else {
        cartItem.quantity = totalQuantity;
        cartItem.pricing_rule_id = null;
        cartItem.price = variant?.price ?? Number(product.base_price ?? 0);
      }
    }

    // --- fallback nếu có pricingRuleId riêng ---
    else if (pricingRuleId) {
      const rule = await this.pricingRuleRepository.findOne({
        where: { id: pricingRuleId },
      });
      if (rule) {
        cartItem.pricing_rule_id = rule.id;
        cartItem.price = Number(rule.price);
      } else {
        cartItem.pricing_rule_id = null;
        cartItem.price = variant?.price ?? Number(product.base_price ?? 0);
      }
    }

    return this.cartItemRepository.save(cartItem);
  }

  async getCart(userId: number): Promise<any> {
    const cart = await this.cartRepository.findOne({
      where: { user_id: userId },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.product.store',
        'items.product.media',
        'items.pricing_rule',
      ],
    });

    if (!cart) {
      return {
        id: null,
        uuid: null,
        user_id: userId,
        items: [],
      };
    }

    // ⚡ Sort cart items theo storeId rồi added_at để giữ thứ tự
    const sortedItems = cart.items.sort((a, b) => {
      const storeA = a.product?.store?.id ?? 0;
      const storeB = b.product?.store?.id ?? 0;
      if (storeA !== storeB) return storeA - storeB;

      return a.added_at.getTime() - b.added_at.getTime();
    });

    const optimizedItems = sortedItems.map((item) => {
      let calculatedPrice: number;

      if (item.pricing_rule) {
        calculatedPrice = Number(item.pricing_rule.price);
      } else {
        calculatedPrice = this.calculatePriceWithRulesForItem(
          item.product,
          item.variant,
          item.quantity,
          item.type,
          item.pricing_rule_id ?? undefined
        );
      }

      return {
        id: item.id,
        uuid: item.uuid,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: calculatedPrice,
        type: item.type ?? 'normal',
        is_group: item.is_group,
        added_at: item.added_at,

        pricing_rule: item.pricing_rule
          ? {
              id: item.pricing_rule.id,
              name: item.pricing_rule.name,
              type: item.pricing_rule.type,
              price: item.pricing_rule.price,
              min_quantity: item.pricing_rule.min_quantity,
              starts_at: item.pricing_rule.starts_at,
              ends_at: item.pricing_rule.ends_at,
            }
          : null,

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
          media: item.product.media.filter((media) => media.is_primary),
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
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale'
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
    cartItemId: number,
    quantity: number
  ): Promise<CartItem> {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['product', 'variant', 'product.pricing_rules'],
    });
    if (!cartItem) throw new NotFoundException('Mục giỏ hàng không tìm thấy');

    const { product, variant, type, pricing_rule_id } = cartItem;

    // Lấy tất cả cartItem trùng nhau (cùng product, variant, type, pricing_rule)
    const where: any = {
      cart_id: cart.id,
      product_id: product.id,
      variant_id: variant?.id ?? undefined,
      type,
    };

    if (pricing_rule_id != null) {
      // khác null hoặc undefined
      where.pricing_rule_id = pricing_rule_id;
    }

    const duplicateItems = await this.cartItemRepository.find({ where });

    // Gộp quantity
    const totalQuantity =
      duplicateItems.reduce((sum, item) => sum + item.quantity, 0) -
      cartItem.quantity +
      quantity; // trừ quantity cũ của item hiện tại, cộng quantity mới

    // Check stock
    if (variant && totalQuantity > (variant.stock ?? 0)) {
      throw new NotFoundException('Không đủ hàng trong kho');
    }

    // Subscription không đổi quantity
    cartItem.quantity = type === 'subscription' ? cartItem.quantity : quantity;

    // Tính lại giá
    let appliedType: 'normal' | 'bulk' | 'subscription' | 'flash_sale' = type;
    let appliedPricingRuleId: number | null;
    let appliedPrice: number;

    switch (type) {
      case 'subscription': {
        const subRule = (product.pricing_rules ?? []).find(
          (r) => r.type === 'subscription'
        );
        appliedType = 'subscription';
        appliedPricingRuleId = subRule?.id ?? null;
        appliedPrice = subRule
          ? Number(subRule.price)
          : variant?.price ?? Number(product.base_price);

        // Gán quantity mặc định bằng min_quantity của rule
        if (subRule && type === 'subscription') {
          cartItem.quantity = subRule.min_quantity ?? 1;
        }
        break;
      }

      case 'bulk':
      case 'normal': {
        const bulkRules = (product.pricing_rules ?? []).filter(
          (r) => r.type === 'bulk'
        );
        const matchedBulkRule = bulkRules
          .filter((r) => cartItem.quantity >= (r.min_quantity ?? 0))
          .sort((a, b) => (b.min_quantity ?? 0) - (a.min_quantity ?? 0))[0];

        if (matchedBulkRule) {
          appliedType = 'bulk';
          appliedPricingRuleId = matchedBulkRule.id ?? null;
          appliedPrice = Number(matchedBulkRule.price);
        } else {
          appliedType = 'normal';
          appliedPricingRuleId = null;
          appliedPrice = variant?.price ?? Number(product.base_price);
        }
        break;
      }
      case 'flash_sale': {
        const flashRule = (product.pricing_rules ?? []).find(
          (r) => r.type === 'flash_sale'
        );

        if (flashRule) {
          // Tính số đã bán cho rule này
          const soldQtyResult = await this.orderItemRepo
            .createQueryBuilder('oi')
            .select('SUM(oi.quantity)', 'total')
            .where('oi.pricing_rule_id = :ruleId', { ruleId: flashRule.id })
            .getRawOne();

          const totalSold = Number(soldQtyResult?.total ?? 0);
          const remainingQty = Math.max(
            0,
            (flashRule.limit_quantity ?? 0) - totalSold
          );

          // Nếu số lượng user muốn > số còn lại, giới hạn lại
          if (cartItem.quantity > remainingQty) {
            cartItem.quantity = remainingQty;
          }

          appliedType = 'flash_sale';
          appliedPricingRuleId = flashRule.id;
          appliedPrice = Number(flashRule.price);
        } else {
          appliedType = 'normal';
          appliedPricingRuleId = null;
          appliedPrice = variant?.price ?? Number(product.base_price);
        }

        break;
      }
    }

    cartItem.type = appliedType;
    cartItem.pricing_rule_id = appliedPricingRuleId;
    cartItem.price = appliedPrice;

    // Lưu item gộp
    const savedItem = await this.cartItemRepository.save(cartItem);

    // Xóa các item duplicate còn lại
    const duplicateIds = duplicateItems
      .map((i) => i.id)
      .filter((id) => id !== cartItem.id);
    if (duplicateIds.length > 0) {
      await this.cartItemRepository.delete(duplicateIds);
    }

    return savedItem;
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
    type: 'bulk' | 'subscription' | 'normal' | 'flash_sale' = 'normal',
    pricingRuleId?: number // <-- thêm param tùy chọn
  ): number {
    // Giá mặc định: variant.price nếu có, không thì base_price
    let currentPrice = variant
      ? Number(variant.price)
      : Number(product.base_price);

    // Nếu có pricing_rule_id, ưu tiên lấy giá từ rule đó
    if (pricingRuleId) {
      const matchedRule = (product.pricing_rules ?? []).find(
        (r) => r.id === pricingRuleId
      );
      if (matchedRule) {
        return Number(matchedRule.price);
      }
    }

    const now = new Date();

    // Lọc các rule còn hiệu lực, đúng type, đúng variant, min_quantity
    const validRules = (product.pricing_rules ?? []).filter((rule) => {
      const startsAt = rule.starts_at ? new Date(rule.starts_at) : new Date(0);
      const endsAt = rule.ends_at
        ? new Date(rule.ends_at)
        : new Date(8640000000000000);
      const minQty = rule.min_quantity ?? 0;

      if (now < startsAt || now > endsAt) return false;
      if (rule.type !== type) return false;

      if (rule.variant) {
        if (!variant || rule.variant.id !== variant.id) return false;
      }

      if (type === 'subscription') return quantity === minQty;
      return quantity >= minQty;
    });

    // Chọn rule có min_quantity lớn nhất
    const bestRule = validRules.sort(
      (a, b) => (b.min_quantity ?? 0) - (a.min_quantity ?? 0)
    )[0];

    if (bestRule) currentPrice = Number(bestRule.price);

    return currentPrice;
  }
}
