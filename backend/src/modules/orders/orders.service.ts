import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, Not } from 'typeorm';
import { Order } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../user/user.entity';
import { Store } from '../store/store.entity';
import { UserAddress } from '../user_address/user_address.entity';
import { OrderItem } from '../order-items/order-item.entity';
import { Inventory } from '../inventory/inventory.entity';
import { Product } from '../product/product.entity';
import { Payment } from '../payments/payment.entity';
import { VouchersService } from '../vouchers/vouchers.service';
import { AffiliateResolutionService } from '../affiliate-links/affiliate-resolution.service';
import { CommissionCalcService } from '../affiliate-commissions/service/commission-calc.service';
import { ReferralsService } from '../referral/referrals.service';
import { Referral } from '../referral/referrals.entity';
import { Subscription } from '../subscription/subscription.entity';
import {
  OrderStatusHistory,
  historyStatus,
} from '../order-status-history/order-status-history.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
import { Wallet } from '../wallet/wallet.entity';
import { WalletTransaction } from '../wallet_transaction/wallet_transaction.entity';
import { OrderStatuses } from './types/orders';
import { OrderFilters } from './types/orders';
import { randomUUID } from 'crypto';
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly vouchersService: VouchersService,
    private readonly affiliateResolutionService: AffiliateResolutionService,
    private readonly commissionCalcService: CommissionCalcService,
    private readonly referralsService: ReferralsService,
    @InjectRepository(OrderStatusHistory)
    private orderStatusHistoryRepository: Repository<OrderStatusHistory>
  ) { }

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    console.log('🚀 Starting order creation with data:', JSON.stringify(createOrderDto, null, 2));

    return this.ordersRepository.manager.transaction(async (manager) => {
      console.log('📝 Starting database transaction for order creation');
      const user = await manager.findOneBy(User, { id: createOrderDto.userId });
      const store = await manager.findOneBy(Store, {
        id: createOrderDto.storeId,
      });
      const address = await manager.findOneBy(UserAddress, {
        id: createOrderDto.addressId,
        user_id: createOrderDto.userId, // 🔥 Kiểm tra địa chỉ thuộc về user
      });

      if (!user || !store || !address) {
        throw new BadRequestException(
          'Không tìm thấy User, Store hoặc Address hoặc Address không thuộc về bạn'
        );
      }

      // BE TỰ TÍNH TOÁN subtotal (kiểm tra tính đúng đắn)
      const calculatedSubtotal = createOrderDto.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      // Cho phép sai số nhỏ do floating point
      const subtotalTolerance = 100; // 100 VND
      if (
        Math.abs(calculatedSubtotal - createOrderDto.subtotal) >
        subtotalTolerance
      ) {
        console.warn(
          `Subtotal difference: ${Math.abs(
            calculatedSubtotal - createOrderDto.subtotal
          )}`
        );
        // Có thể throw error hoặc sử dụng calculatedSubtotal tùy nghiệp vụ
      }

      //  BE TỰ TÍNH DISCOUNT
      let discountTotal = 0;
      const appliedVouchers: { voucherId: number; discount: number }[] = [];

      if (
        createOrderDto.voucherCodes &&
        createOrderDto.voucherCodes.length > 0
      ) {
        for (const code of createOrderDto.voucherCodes) {
          try {
            const { voucher, discount } =
              await this.vouchersService.validateVoucher(
                code,
                createOrderDto.userId,
                createOrderDto.items,
                createOrderDto.storeId
              );
            discountTotal += Number(discount) || 0;
            appliedVouchers.push({ voucherId: voucher.id, discount });
          } catch (error) {
            console.error(`❌ Voucher error (${code}):`, error);
            throw new BadRequestException(`Voucher ${code} không hợp lệ`);
          }
        }
      }

      //  BE TỰ TÍNH TOTAL AMOUNT
      const totalAmount =
        calculatedSubtotal + createOrderDto.shippingFee - discountTotal;

      console.log('💰 BE Calculation:', {
        subtotalFromFE: createOrderDto.subtotal,
        subtotalCalculated: calculatedSubtotal,
        shippingFee: createOrderDto.shippingFee,
        discountTotal,
        totalAmount,
      });

      // === Resolve affiliate information ===
      let affiliateInfo = null;
      if (createOrderDto.affiliateCode) {
        try {
          console.log('🔍 Resolving affiliate code:', createOrderDto.affiliateCode);

          // Validate affiliate code format
          if (!createOrderDto.affiliateCode.trim()) {
            throw new BadRequestException('Affiliate code cannot be empty');
          }

          // Get the first product ID for affiliate link resolution
          const firstProductId = createOrderDto.items.length > 0 ? createOrderDto.items[0].productId : undefined;
          const firstVariantId = createOrderDto.items.length > 0 ? createOrderDto.items[0].variantId : undefined;

          console.log('📦 Product info for affiliate resolution:', { firstProductId, firstVariantId });

          affiliateInfo = await this.affiliateResolutionService.resolveAffiliateCode(
            createOrderDto.affiliateCode.trim(),
            firstProductId,
            firstVariantId
          );

          if (affiliateInfo && affiliateInfo.isValid) {
            console.log('✅ Affiliate resolved:', affiliateInfo);
          } else {
            console.warn('⚠️ Invalid affiliate code - user not found or not active:', createOrderDto.affiliateCode);
            // For better user experience, continue with order but log the issue
            // In production, you might want to throw an error instead:
            // throw new BadRequestException(`Invalid affiliate code: ${createOrderDto.affiliateCode}`);
          }
        } catch (error) {
          console.error('❌ Affiliate resolution error:', error);

          if (error instanceof BadRequestException) {
            // Re-throw validation errors
            throw error;
          }

          console.error('Error details:', error instanceof Error ? error.message : String(error));
          console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');

          // For database/network errors, continue without affiliate tracking
          // but log the issue for monitoring
          affiliateInfo = null;
          console.warn('⚠️ Continuing order creation without affiliate tracking due to resolution error');
        }
      }

      // Tạo order với các giá trị BE đã tính
      const order = manager.create(Order, {
        status: OrderStatuses.pending,
        subtotal: calculatedSubtotal, // Sử dụng giá trị BE tính
        shippingFee: createOrderDto.shippingFee,
        discountTotal, // BE tính
        totalAmount, // BE tính
        currency: createOrderDto.currency ?? 'VND',
        user,
        store,
        userAddress: address,
        // Affiliate tracking - use resolved info if available, otherwise use provided values
        affiliate_code: createOrderDto.affiliateCode?.trim() || null,
        affiliate_user_id: affiliateInfo?.userId || createOrderDto.affiliateUserId || null,
        affiliate_program_id: createOrderDto.affiliateProgramId || null,
      } as any);

      // 🐛 DEBUG: Log affiliate data being saved
      console.log('🔍 DEBUG - Saving order with affiliate data:', {
        affiliate_code: createOrderDto.affiliateCode,
        affiliate_user_id: affiliateInfo?.userId || createOrderDto.affiliateUserId,
        affiliate_program_id: createOrderDto.affiliateProgramId,
      });

      const savedOrder = await manager.save(order);
      console.log('✅ Order saved successfully with ID:', savedOrder.id);

      // === Tạo Referral Relationship nếu có affiliate ===
      // Single-Parent Model: User chỉ có 1 referrer duy nhất (first come first serve)
      if (affiliateInfo && affiliateInfo.isValid && affiliateInfo.userId) {
        try {
          console.log('🔗 Attempting to create referral relationship:', {
            referrer_id: affiliateInfo.userId,
            referee_id: createOrderDto.userId,
            code: createOrderDto.affiliateCode
          });

          // CHECK 1: User đã là child của ai chưa? (Single-Parent Rule)
          const existingAsReferee = await manager.findOne(Referral, {
            where: {
              referee: { id: createOrderDto.userId }
            },
            relations: ['referrer']
          });

          if (existingAsReferee) {
            console.log('ℹ️ User already has a referrer (Single-Parent Rule):', {
              existing_referrer_id: existingAsReferee.referrer.id,
              current_affiliate_id: affiliateInfo.userId
            });
            console.log('⚠️ Skipping referral creation - First referrer wins!');
            console.log('💰 Note: Current affiliate will still receive commission for this order');
          } else {
            // CHECK 2: Tránh duplicate với cùng 1 affiliate (không cần thiết nhưng để chắc chắn)
            const existingReferral = await manager.findOne(Referral, {
              where: {
                referrer: { id: affiliateInfo.userId },
                referee: { id: createOrderDto.userId }
              }
            });

            if (!existingReferral) {
              // Tạo referral mới - User này chưa có referrer
              const referral = manager.create(Referral, {
                referrer: { id: affiliateInfo.userId } as any,
                referee: { id: createOrderDto.userId } as any,
                code: createOrderDto.affiliateCode,
                status: 'active',
                uuid: randomUUID(),
                created_at: new Date(),
              });

              await manager.save(referral);
              console.log('✅ Referral relationship created - First referrer wins!');
              console.log('🌳 User is now part of affiliate tree:', {
                parent: affiliateInfo.userId,
                child: createOrderDto.userId
              });
            } else {
              console.log('ℹ️ Referral relationship already exists with this affiliate');
            }
          }
        } catch (error) {
          console.error('❌ Error creating referral relationship:', error);
          // Don't fail the order if referral creation fails
          console.warn('⚠️ Continuing order creation despite referral error');
        }
      }

      // === Tạo OrderItems và cập nhật Inventory / Variant ===
      for (const itemDto of createOrderDto.items) {
        console.log('📦 Creating order item:', itemDto);

        // Lấy sản phẩm
        const product = await manager.findOneBy(Product, {
          id: itemDto.productId,
        });
        if (!product) {
          console.error(`❌ Product #${itemDto.productId} not found`);
          throw new BadRequestException(
            `Sản phẩm #${itemDto.productId} không tồn tại`
          );
        }

        let variant: Variant | null = null;
        let itemPrice = itemDto.price;

        // Lấy biến thể nếu có
        if (itemDto.variantId) {
          variant = await manager.findOneBy(Variant, { id: itemDto.variantId });
          if (!variant) {
            console.error(`❌ Variant #${itemDto.variantId} not found`);
            throw new BadRequestException(
              `Biến thể #${itemDto.variantId} không tồn tại`
            );
          }
          // Chuyển price của variant sang number
          itemPrice = Number(variant.price);
          console.log(`Variant price: ${itemPrice}`);

          if ((variant.stock ?? 0) < itemDto.quantity) {
            console.error(
              `❌ Not enough variant stock: ${variant.stock}, required: ${itemDto.quantity}`
            );
            throw new BadRequestException(
              `Không đủ tồn kho cho biến thể #${itemDto.variantId}`
            );
          }
        }
        // Kiểm tra pricing rules
        // ✅ Nếu có truyền pricing_rule_id từ client
        let appliedRule: PricingRules | null = null;

        if (itemDto.pricingRuleId) {
          appliedRule = await manager.findOne(PricingRules, {
            where: { id: itemDto.pricingRuleId },
          });

          if (!appliedRule) {
            throw new Error(
              `Không tìm thấy pricing rule với ID ${itemDto.pricingRuleId}`
            );
          }

          // ⚡ Flash Sale: kiểm tra giới hạn số lượng còn lại
          if (
            appliedRule.type === 'flash_sale' &&
            appliedRule.limit_quantity != null
          ) {
            const soldCount = await manager
              .createQueryBuilder('order_items', 'oi')
              .where('oi.pricing_rule_id = :ruleId', { ruleId: appliedRule.id })
              .select('COALESCE(SUM(oi.quantity), 0)', 'total')
              .getRawOne();

            const totalSold = Number(soldCount?.total ?? 0);
            const remaining = appliedRule.limit_quantity - totalSold;

            if (remaining <= 0) {
              throw new Error('Flash sale này đã hết hàng');
            }
            if (itemDto.quantity > remaining) {
              throw new Error(`Flash sale này chỉ còn ${remaining} sản phẩm`);
            }
          }

          // ✅ Áp dụng giá từ rule
          itemPrice = Number(appliedRule.price);
          console.log(
            `Áp dụng pricing rule #${appliedRule.id} cho sản phẩm #${itemDto.productId}: price=${itemPrice}`
          );

          // 🔁 Nếu là subscription → xử lý ví & tạo Subscription record
          if (appliedRule.type === 'subscription') {
            const wallet = await manager.findOne(Wallet, {
              where: { user_id: order.user.id },
            });
            if (!wallet) {
              throw new Error('User chưa có ví');
            }

            if (wallet.balance < itemPrice) {
              throw new Error(
                `Số dư ví không đủ để mua gói (cần ${itemPrice} xu, hiện có ${wallet.balance} xu)`
              );
            }

            // Trừ tiền
            wallet.balance -= itemPrice;
            wallet.updated_at = new Date();
            await manager.save(wallet);

            // Tạo giao dịch ví
            const tx = manager.create(WalletTransaction, {
              uuid: randomUUID(),
              wallet,
              wallet_id: wallet.id,
              type: 'subscription_purchase',
              amount: -itemPrice,
              reference: `subscription:${itemDto.productId}:${itemDto.variantId ?? '0'
                }`,
              created_at: new Date(),
            });
            await manager.save(tx);

            // Tạo Subscription mới
            const startDate = new Date();
            const endDate = new Date();

            const cycle = appliedRule.cycle || '30 days';
            const match = cycle.match(/(\d+)\s*(day|days|month|months)/i);
            let durationDays = 30;
            if (match) {
              const num = parseInt(match[1]);
              const unit = match[2].toLowerCase();
              durationDays = unit.startsWith('month') ? num * 30 : num;
            }
            endDate.setDate(startDate.getDate() + durationDays);

            const subscription = manager.create(Subscription, {
              uuid: crypto.randomUUID(),
              user: order.user,
              product: { id: itemDto.productId },
              variant: itemDto.variantId ? { id: itemDto.variantId } : null,
              pricingRule: { id: appliedRule.id },
              name: appliedRule.name ?? 'Subscription',
              price: itemPrice,
              cycle,
              totalQuantity: itemDto.quantity,
              remainingQuantity: itemDto.quantity,
              startDate,
              endDate,
              status: 'active',
            });

            await manager.save(subscription);
            console.log(`Tạo subscription mới: #${subscription.id} (${cycle})`);
          }
        } else {
          // ❌ Nếu không có pricing_rule_id thì fallback sang logic cũ (tuỳ bạn giữ hoặc bỏ)
          console.warn(
            '⚠️ Không có pricing_rule_id, fallback sang logic tự động tìm rule'
          );
        }

        // Kiểm tra tồn kho trong Inventory
        const inventory = await manager.findOne(Inventory, {
          where: {
            product: { id: itemDto.productId },
            variant: itemDto.variantId ? { id: itemDto.variantId } : IsNull(),
          },
        });

        if (!inventory) {
          throw new BadRequestException(
            `Không tìm thấy kho cho sản phẩm #${itemDto.productId}`
          );
        }

        const { available } = await manager
          .createQueryBuilder(Inventory, 'inv')
          .select(
            'COALESCE(SUM(inv.quantity - COALESCE(inv.used_quantity, 0)), 0)',
            'available'
          )
          .where('inv.variant_id = :variantId', {
            variantId: itemDto.variantId,
          })
          .getRawOne();

        if (Number(available) < itemDto.quantity) {
          throw new BadRequestException(
            `Không đủ hàng trong kho cho biến thể #${itemDto.variantId}`
          );
        }

        // Tạo OrderItem
        const orderItem = manager.create(OrderItem, {
          order: savedOrder,
          product,
          variant: variant ?? null,
          quantity: itemDto.quantity,
          price: itemPrice,
          discount: discountTotal / createOrderDto.items.length,
          subtotal:
            itemDto.quantity * itemPrice -
            (discountTotal / createOrderDto.items.length || 0),
          pricing_rule: appliedRule ?? undefined,
        });

        console.log('OrderItem created:', orderItem);

        await manager.save(orderItem);

        // Cập nhật tạm thời tồn kho
        inventory.used_quantity =
          (inventory.used_quantity || 0) + itemDto.quantity;
        await manager.save(inventory);
      }

      // Áp dụng voucher sau khi tạo order thành công
      for (const { voucherId } of appliedVouchers) {
        await this.vouchersService.applyVoucher(
          voucherId,
          createOrderDto.userId,
          savedOrder,
          manager
        );
      }

      return savedOrder;
    });
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      where: {
        status: Not(OrderStatuses.draft), 
      },
      relations: [
        'user',
        'store',
        'userAddress',
        'voucherUsages',
        'voucherUsages.voucher',
      ],
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('order.userAddress', 'userAddress')
      .leftJoinAndSelect('order.orderItem', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('product.media', 'media')
      .leftJoinAndSelect('orderItem.variant', 'variant')
      .leftJoinAndSelect('orderItem.pricing_rule', 'pricingRule')
      .leftJoinAndSelect('order.voucherUsages', 'voucherUsages')
      .leftJoinAndSelect('voucherUsages.voucher', 'voucher')
      .leftJoinAndSelect('product.reviews', 'reviews')
      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('order.group_order', 'groupOrder')
      .where('order.id = :id', { id })
      .getOne();

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
    }
    return order;
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order);
  }

  async changeStatus(
    id: number,
    status: string,
    user: User,
    note?: string
  ): Promise<Order> {
    const order = await this.findOne(id);
    console.log('--- DEBUG store ---');
    console.log('order.status (number):', order.status);
    console.log('OrderStatuses.pending:', OrderStatuses.pending);
    console.log('order.store.user_id:', order.store?.user_id);
    console.log('current user.id:', user.id);

    const statusMap: Record<string, OrderStatuses> = {
      pending: OrderStatuses.pending,
      confirmed: OrderStatuses.confirmed,
      processing: OrderStatuses.processing,
      shipped: OrderStatuses.shipped,
      delivered: OrderStatuses.delivered,
      completed: OrderStatuses.completed,
      cancelled: OrderStatuses.cancelled,
      returned: OrderStatuses.returned,
    };

    const newStatus = statusMap[status];
    if (newStatus === undefined) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    const isCustomer = Number(user.id) === order.user.id;
    const isStore = Number(user.id) === order.store.user_id;

    if (isCustomer) {
      if (Number(order.status) !== OrderStatuses.pending) {
        throw new BadRequestException('Khách hàng chỉ có thể hủy đơn');
      }
      if (Number(order.status) !== OrderStatuses.pending) {
        throw new BadRequestException(
          'Khách hàng chỉ có thể hủy đơn khi đơn hàng đang chờ'
        );
      }
    }

    if (isStore) {
      if (Number(order.status) !== OrderStatuses.pending) {
        throw new BadRequestException(
          'Cửa hàng chỉ có thể xác nhận đơn đang chờ'
        );
      }
      // store chỉ cho phép confirm hoặc cancel
      if (
        ![OrderStatuses.confirmed, OrderStatuses.cancelled].includes(newStatus)
      ) {
        throw new BadRequestException(
          'Cửa hàng không thể đổi sang trạng thái này'
        );
      }
    }

    if (!isCustomer && !isStore) {
      throw new BadRequestException('Bạn không có quyền thay đổi đơn hàng này');
    }

    const oldStatus = order.status;
    order.status = newStatus;
    const updatedOrder = await this.ordersRepository.save(order);

    // Lưu lịch sử
    const history = new OrderStatusHistory();
    history.order = updatedOrder;
    history.oldStatus = oldStatus as unknown as historyStatus;
    history.newStatus = newStatus as unknown as historyStatus;
    history.changedBy = user;
    history.note = note ?? '';
    await this.orderStatusHistoryRepository.save(history);

    if (newStatus === OrderStatuses.confirmed) {
      const orderItems = await this.orderItemsRepository.find({
        where: { order: { id: order.id } },
        relations: ['product', 'variant'],
      });

      for (const item of orderItems) {
        const inventory = await this.inventoryRepository.findOne({
          where: {
            product: { id: item.product.id },
            variant: item.variant ? { id: item.variant.id } : IsNull(),
          },
        });

        if (!inventory) continue;

        // Nếu kho không đủ (tránh lỗi do update chậm)
        if ((inventory.quantity || 0) < item.quantity) {
          throw new BadRequestException(
            `Kho không đủ hàng cho ${item.product.name}`
          );
        }

        inventory.quantity -= item.quantity;
        inventory.used_quantity -= item.quantity;
        await this.inventoryRepository.save(inventory);
      }

      console.log(`Đã trừ hàng khi cửa hàng xác nhận đơn #${order.id}`);
    }

    return updatedOrder;
  }

  async getRevenue(): Promise<number> {
    const { sum } = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'sum')
      .where('order.status = :status', { status: OrderStatuses.completed })
      .getRawOne();

    return Number(sum) || 0;
  }

  async findByPaymentUuid(paymentUuid: string): Promise<any> {
    const payment = await this.paymentsRepository.findOne({
      where: { uuid: paymentUuid },
      relations: [
        'order',
        'order.orderItem',
        'order.orderItem.product',
        'order.orderItem.variant',
        'order.user',
        'order.store',
        'order.userAddress',
        'order.voucherUsages',
        'order.voucherUsages.voucher',
      ],
    });

    if (!payment || !payment.order) {
      throw new NotFoundException(
        `Không tìm thấy đơn hàng cho UUID thanh toán: ${paymentUuid}`
      );
    }

    const order = payment.order;
    return {
      success: true,
      orderCode: order.id.toString(),
      total: order.totalAmount,
      paymentMethodLabel: payment.paymentMethod?.name || 'VNPay',
      etaLabel: 'Dự kiến giao trong 2-3 ngày',
      items: order.orderItem.map((item) => ({
        id: item.id,
        name: item.product.name,
        image: item.product.media || '',
        quantity: item.quantity,
        price: item.price,
        oldPrice: item.price,
      })),
      vouchers: order.voucherUsages.map((usage) => ({
        code: usage.voucher.code,
        title: usage.voucher.title,
        discount: usage.voucher.discount_value,
      })),
    };
  }

  async getStoreRevenue(storeId: number): Promise<number> {
    const { sum } = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'sum')
      .where('order.store_id = :storeId', { storeId })
      .andWhere('order.status != :waitingGroup', {
        waitingGroup: OrderStatuses.waiting_group
      })
      .getRawOne();

    return Number(sum ?? 0);
  }

  // Mở rộng findByStore để hỗ trợ filters và pagination
  async findByStore(
    storeId: number,
    filters: OrderFilters = {}
  ): Promise<Order[]> {
    // ========== BƯỚC 1: BUILD QUERY ==========
    let query = this.ordersRepository
      .createQueryBuilder('order')
      // User & Profile
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('user.profile', 'userProfile')
      // Address
      .leftJoinAndSelect('order.userAddress', 'userAddress')
      // Order Items
      .leftJoinAndSelect('order.orderItem', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('orderItem.variant', 'variant')

      .leftJoinAndSelect('order.voucherUsages', 'voucherUsages')
      .leftJoinAndSelect('voucherUsages.voucher', 'voucher')

      .leftJoinAndSelect('order.payment', 'payment')
      .leftJoinAndSelect('payment.paymentMethod', 'paymentMethod')

      .leftJoinAndSelect('order.group_order', 'group_order')
      .leftJoinAndSelect('group_order.user', 'group_host')
      .leftJoinAndSelect('group_host.profile', 'group_host_profile')

      .leftJoinAndSelect(
        'product.reviews',
        'reviews',
        'reviews.order_id = order.id'
      )
      .where('order.store_id = :storeId', { storeId })
      .andWhere('order.status != :waitingGroup', {
        waitingGroup: OrderStatuses.waiting_group
      })
      .andWhere('order.status != :draft', { draft: OrderStatuses.draft });

    // ========== BƯỚC 2: APPLY FILTERS ==========

    // Filter by status
    if (filters.status !== undefined && filters.status !== null) {
      query = query.andWhere('order.status = :status', {
        status: Number(filters.status),
      });
    }

    // Filter by payment status
    if (filters.paymentStatus !== undefined && filters.paymentStatus !== null) {
      query = query.andWhere('payment.status = :paymentStatus', {
        paymentStatus: Number(filters.paymentStatus),
      });
    }

    // Filter by date range
    if (filters.fromDate) {
      query = query.andWhere('order.createdAt >= :fromDate', {
        fromDate: filters.fromDate,
      });
    }
    if (filters.toDate) {
      query = query.andWhere('order.createdAt <= :toDate', {
        toDate: filters.toDate,
      });
    }

    // Search by customer name, email, or order ID
    if (filters.search) {
      query = query.andWhere(
        `(
        userAddress.recipientName ILIKE :search OR
        user.username ILIKE :search OR
        user.email ILIKE :search OR
        order.id::text ILIKE :search
      )`,
        { search: `%${filters.search}%` }
      );
    }

    // ========== BƯỚC 3: EXECUTE QUERY (KHÔNG PAGINATION Ở ĐÂY) ==========
    // Lấy tất cả orders trước, sau đó mới group và paginate
    const allOrders = await query.orderBy('order.id', 'DESC').getMany();

    console.log(`📦 Total orders fetched: ${allOrders.length}`);

    // ========== BƯỚC 4: GROUP ORDERS THEO GROUP_ORDER_ID ==========
    const groupedOrdersMap = new Map<string, Order>();
    const groupOrderIds = new Set<number>();
    const groupStats = new Map<
      number,
      {
        totalAmount: number;
        totalQuantity: number;
        memberCount: number;
        allOrders: Order[];
      }
    >();

    // Phân loại orders
    allOrders.forEach((order) => {
      if (order.group_order_id) {
        //  Đơn nhóm
        const groupId = order.group_order_id;

        // Lưu thống kê group
        if (!groupStats.has(groupId)) {
          groupStats.set(groupId, {
            totalAmount: 0,
            totalQuantity: 0,
            memberCount: 0,
            allOrders: [],
          });
        }

        const stats = groupStats.get(groupId)!;
        stats.totalAmount += Number(order.totalAmount || 0);
        stats.memberCount += 1;
        stats.allOrders.push(order);
        //tong so luong san pham
        const orderQuantity = (order.orderItem || []).reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
        stats.totalQuantity += orderQuantity;

        // Chỉ lưu order đầu tiên làm đại diện
        const groupKey = `group_${groupId}`;
        if (!groupedOrdersMap.has(groupKey)) {
          groupedOrdersMap.set(groupKey, order);
          groupOrderIds.add(groupId);
        }
      } else {
        //  Đơn lẻ
        groupedOrdersMap.set(`single_${order.id}`, order);
      }
    });

    console.log(
      ` After grouping: ${groupedOrdersMap.size} items (${groupOrderIds.size
      } groups, ${groupedOrdersMap.size - groupOrderIds.size} singles)`
    );

    // ========== BƯỚC 5: CONVERT MAP → ARRAY VÀ ADD METADATA ==========
    let resultOrders = Array.from(groupedOrdersMap.values()).map((order) => {
      const enrichedOrder: any = { ...order };

      if (order.group_order_id) {
        const stats = groupStats.get(order.group_order_id);
        if (stats) {
          enrichedOrder.group_total_amount = stats.totalAmount;
          enrichedOrder.group_total_quantity = stats.totalQuantity;
          enrichedOrder.group_member_count = stats.memberCount;
          enrichedOrder.group_all_orders = stats.allOrders; // Để frontend dùng khi cần
        }
      } else {
        enrichedOrder.group_total_amount = null;
        enrichedOrder.group_total_quantity = null;
        enrichedOrder.group_member_count = null;
      }

      return enrichedOrder;
    });

    // ========== BƯỚC 6: APPLY PAGINATION ==========
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    resultOrders = resultOrders.slice(startIndex, endIndex);

    console.log(`📄 Page ${page}: Returning ${resultOrders.length} items`);

    return resultOrders as Order[];
  }

  // Đếm số lượng orders của store (cho pagination)
  async countOrdersByStore(
    storeId: number,
    filters: OrderFilters = {}
  ): Promise<number> {
    // Build query tương tự findByStore
    let query = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .leftJoin('order.userAddress', 'userAddress')
      .leftJoin('order.payment', 'payment')
      .where('order.store_id = :storeId', { storeId })
      .andWhere('order.status != :waitingGroup', {
        waitingGroup: OrderStatuses.waiting_group
      });

    // Apply filters
    if (filters.status !== undefined && filters.status !== null) {
      query = query.andWhere('order.status = :status', {
        status: Number(filters.status),
      });
    }
    if (filters.paymentStatus !== undefined && filters.paymentStatus !== null) {
      query = query.andWhere('payment.status = :paymentStatus', {
        paymentStatus: Number(filters.paymentStatus),
      });
    }
    if (filters.fromDate) {
      query = query.andWhere('order.createdAt >= :fromDate', {
        fromDate: filters.fromDate,
      });
    }
    if (filters.toDate) {
      query = query.andWhere('order.createdAt <= :toDate', {
        toDate: filters.toDate,
      });
    }
    if (filters.search) {
      query = query.andWhere(
        `(
        userAddress.recipientName ILIKE :search OR
        user.username ILIKE :search OR
        user.email ILIKE :search OR
        order.id::text ILIKE :search
      )`,
        { search: `%${filters.search}%` }
      );
    }

    // ✅ Lấy tất cả orders để count sau khi group
    const allOrders = await query.getMany();

    // Group để đếm đúng
    const uniqueGroups = new Set<string>();
    allOrders.forEach((order) => {
      if (order.group_order_id) {
        uniqueGroups.add(`group_${order.group_order_id}`);
      } else {
        uniqueGroups.add(`single_${order.id}`);
      }
    });

    return uniqueGroups.size;
  }

  // Thống kê cho store (cho cards trong Sale.tsx)
  async getStoreStats(storeId: number): Promise<{
    totalOrders: number;
    completed: number;
    pending: number;
    totalRevenue: number;
  }> {
    const totalOrders = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.store_id = :storeId', { storeId })
      .getCount();

    const completed = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.store_id = :storeId', { storeId })
      .andWhere('order.status = :status', { status: OrderStatuses.completed })
      .getCount();

    const pending = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.store_id = :storeId', { storeId })
      .andWhere('order.status = :status', { status: OrderStatuses.pending })
      .getCount();

    const totalRevenue = await this.getStoreRevenue(storeId);

    return {
      totalOrders,
      completed,
      pending,
      totalRevenue,
    };
  }

  // Đếm orders của user (cho UserOrdersController)
  async countOrdersByUser(
    userId: number,
    filters: OrderFilters = {}
  ): Promise<number> {
    let query = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.user_id = :userId', { userId });

    if (filters.status) {
      query = query.andWhere('order.status = :status', {
        status: filters.status,
      });
    }

    return query.getCount();
  }

  async findByUser2(userId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { 
      user: { id: userId },
      status: Not(OrderStatuses.draft), 
    },
      relations: [
        'store',
        'user',
        'userAddress',
        'voucherUsages',
        'voucherUsages.voucher',
        'group_order',
        'payment',
        'payment.paymentMethod',
        'orderItem',
        'orderItem.product',
        'orderItem.product.media',
        'orderItem.variant',
        'orderItem.product.reviews', // relation đúng từ entity Product
        'orderItem.product.reviews.user', // để biết reviewer là ai
        'orderItem.product.reviews.order',
        'orderItem.pricing_rule',
      ],
      order: { id: 'DESC' },
    });
  }
  // Mở rộng findByUser để hỗ trợ filter và pagination
  async findByUser(
    userId: number,
    filters: OrderFilters = {}
  ): Promise<Order[]> {
    let query = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.store', 'store')
      .leftJoinAndSelect('order.userAddress', 'userAddress')
      .leftJoinAndSelect('order.voucherUsages', 'voucherUsages')
      .leftJoinAndSelect('voucherUsages.voucher', 'voucher')
      .where('order.user_id = :userId', { userId })
      .andWhere('order.status != :draft', { draft: OrderStatuses.draft });

    if (filters.status) {
      query = query.andWhere('order.status = :status', {
        status: filters.status,
      });
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    query = query.skip((page - 1) * limit).take(limit);

    return query.orderBy('order.id', 'DESC').getMany();
  }

  async getOrderStats(storeId: number) {
    const [totalRevenue, totalOrders, completed, pending] = await Promise.all([
      this.ordersRepository
        .createQueryBuilder('o')
        .leftJoin('o.store', 'store')
        .select('SUM(CAST(o.totalAmount AS DECIMAL(15,2)))', 'sum')
        .where('store.id = :storeId', { storeId })
        .getRawOne(),
      this.ordersRepository.count({ where: { store: { id: storeId } } }),

      this.ordersRepository.count({
        where: { store: { id: storeId }, status: OrderStatuses.completed },
      }),

      this.ordersRepository.count({
        where: { store: { id: storeId }, status: OrderStatuses.pending },
      }),
    ]);

    return {
      totalRevenue: Number(totalRevenue.sum || 0),
      totalOrders,
      completed,
      pending,
    };
  }

  /**
   * Update order status and trigger commission calculation if order is paid
   */
  async updateOrderStatus(orderId: number, status: OrderStatuses): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    // Update order status
    order.status = status;
    const updatedOrder = await this.ordersRepository.save(order);

    // Trigger commission calculation if order is completed
    if (status === OrderStatuses.completed) {
      try {
        console.log(`🎯 Triggering commission calculation for order ${orderId}`);
        await this.commissionCalcService.handleOrderPaid(orderId);
        console.log(`✅ Commission calculation completed for order ${orderId}`);
      } catch (error) {
        console.error(`❌ Commission calculation failed for order ${orderId}:`, error);
        // Don't throw error to prevent order update failure
      }
    }

    return updatedOrder;
  }

  /**
   * Update order with DTO
   */
  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    // Update order fields
    Object.assign(order, updateOrderDto);
    const updatedOrder = await this.ordersRepository.save(order);

    // If status is being updated to completed, trigger commission calculation
    if (updateOrderDto.status && updateOrderDto.status === OrderStatuses.completed) {
      try {
        console.log(`🎯 Triggering commission calculation for order ${id}`);
        await this.commissionCalcService.handleOrderPaid(id);
        console.log(`✅ Commission calculation completed for order ${id}`);
      } catch (error) {
        console.error(`❌ Commission calculation failed for order ${id}:`, error);
      }
    }

    return updatedOrder;
  }
}
