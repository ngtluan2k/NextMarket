import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Order, OrderStatuses } from './order.entity';
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
import {
  OrderStatusHistory,
  historyStatus,
} from '../order-status-history/order-status-history.entity';
import { Variant } from '../variant/variant.entity';
import { PricingRules } from '../pricing-rule/pricing-rule.entity';
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    @InjectRepository(UserAddress)
    private readonly addressesRepository: Repository<UserAddress>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly vouchersService: VouchersService,
    @InjectRepository(OrderStatusHistory)
    private orderStatusHistoryRepository: Repository<OrderStatusHistory>
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersRepository.manager.transaction(async (manager) => {
      const user = await manager.findOneBy(User, { id: createOrderDto.userId });
      const store = await manager.findOneBy(Store, {
        id: createOrderDto.storeId,
      });
      const address = await manager.findOneBy(UserAddress, {
        id: createOrderDto.addressId,
      });

      if (!user || !store || !address) {
        throw new BadRequestException(
          'Không tìm thấy User, Store hoặc Address'
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
      });

      const savedOrder = await manager.save(order);

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
      const pricingRule = await manager
        .createQueryBuilder(PricingRules, 'pricing_rule')
        .where('pricing_rule.product_id = :productId', { productId: itemDto.productId })
        .andWhere('pricing_rule.min_quantity <= :quantity', { quantity: itemDto.quantity })
        .andWhere('pricing_rule.starts_at <= :now', { now: new Date() })
        .andWhere('pricing_rule.ends_at >= :now', { now: new Date() })
        .orderBy('pricing_rule.min_quantity', 'DESC') // Ưu tiên quy tắc với số lượng tối thiểu cao hơn
        .getOne();

      if (pricingRule) {
        itemPrice = Number(pricingRule.price); // Ghi đè giá bằng pricing rule
        console.log(`Áp dụng pricing rule cho sản phẩm #${itemDto.productId}: price=${itemPrice}`);
      }

        // Kiểm tra tồn kho trong Inventory
        const inventory = await manager.findOne(Inventory, {
          where: {
            product: { id: itemDto.productId },
            variant: itemDto.variantId ? { id: itemDto.variantId } : IsNull(),
          },
        });
        if (
          !inventory ||
          inventory.quantity - inventory.used_quantity < itemDto.quantity
        ) {
          console.error(
            `❌ Not enough inventory for product #${itemDto.productId}`
          );
          throw new BadRequestException(
            `Không đủ hàng trong kho cho sản phẩm #${itemDto.productId}`
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
          subtotal: itemDto.quantity * itemPrice - (discountTotal / createOrderDto.items.length || 0),
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
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: [
        'user',
        'store',
        'userAddress',
        'orderItem',
        'orderItem.product',
        'orderItem.product.media',
        'orderItem.variant',
        'voucherUsages',
        'voucherUsages.voucher',
        'orderItem.product.reviews',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    return await this.ordersRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.ordersRepository.remove(order);
  }

  async changeStatus(
    id: number,
    status: string, // 👈 nhận string
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

    // check quyền y chang bạn đang làm
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

    return updatedOrder;
  }

  async findByUser(userId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: [
        'store',
        'userAddress',
        'voucherUsages',
        'voucherUsages.voucher',
      ],
      order: { id: 'DESC' },
    });
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
  async findByStore(storeId: number): Promise<Order[]> {
  return this.ordersRepository
    .createQueryBuilder('order')
    .leftJoinAndSelect('order.user', 'user')
    .leftJoinAndSelect('order.userAddress', 'userAddress')
    .leftJoinAndSelect('order.orderItem', 'orderItem')
    .leftJoinAndSelect('orderItem.product', 'product')
    .leftJoinAndSelect('orderItem.variant', 'variant')
    .leftJoinAndSelect('order.voucherUsages', 'voucherUsages')
    .leftJoinAndSelect('voucherUsages.voucher', 'voucher')
    .leftJoinAndSelect('order.payment', 'payment')
    // join reviews nhưng có điều kiện order_id = order.id
    .leftJoinAndSelect(
      'product.reviews',
      'reviews',
      'reviews.order_id = order.id'
    )
    .where('order.store_id = :storeId', { storeId })
    .orderBy('order.id', 'DESC')
    .getMany();
}

}
