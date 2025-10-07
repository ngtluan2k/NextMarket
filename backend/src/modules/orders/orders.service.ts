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
      console.log('User:', user);
      const store = await manager.findOneBy(Store, {
        id: createOrderDto.storeId,
      });
      console.log('Store:', store);
      const address = await manager.findOneBy(UserAddress, {
        id: createOrderDto.addressId,
      });
      console.log('Address:', address);

      if (!user || !store || !address) {
        throw new BadRequestException(
          'Không tìm thấy User, Store hoặc Address'
        );
      }

      const subtotal = createOrderDto.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );

      let discountTotal = 0;
      const appliedVouchers: { voucherId: number; discount: number }[] = [];
      if (
        createOrderDto.voucherCodes &&
        createOrderDto.voucherCodes.length > 0
      ) {
        for (const code of createOrderDto.voucherCodes) {
          const { voucher, discount } =
            await this.vouchersService.validateVoucher(
              code,
              createOrderDto.userId,
              createOrderDto.items,
              createOrderDto.storeId
            );

          if (!voucher.stackable && createOrderDto.voucherCodes.length > 1) {
            throw new BadRequestException(
              `Voucher ${code} không thể kết hợp với các voucher khác`
            );
          }

          discountTotal += discount;
          appliedVouchers.push({ voucherId: voucher.id, discount });
        }
      }

      const totalAmount =
        subtotal + (createOrderDto.shippingFee || 0) - discountTotal;

      if (totalAmount !== createOrderDto.totalAmount) {
        throw new BadRequestException('Tổng số tiền không khớp');
      }

      const order = manager.create(Order, {
        status: OrderStatuses.Pending,
        subtotal,
        shippingFee: createOrderDto.shippingFee ?? 0,
        discountTotal,
        totalAmount,
        currency: createOrderDto.currency ?? 'VND',
        user,
        store,
        userAddress: address,
      });

      const savedOrder = await manager.save(order);

      for (const item of createOrderDto.items) {
        const product = await manager.findOneBy(Product, {
          id: item.productId,
        });
        console.log('Product:', product);

        if (!product) {
          throw new BadRequestException(
            `Không tìm thấy sản phẩm ${item.productId}`
          );
        }

        let inventory = null;
        // Nếu có variantId, ưu tiên tìm với variantId
        if (item.variantId) {
          inventory = await manager.findOne(Inventory, {
            where: {
              product: { id: item.productId },
              variant: { id: item.variantId },
            },
          });
        }
        // Nếu không tìm thấy với variantId hoặc không có variantId, tìm với variant_id IS NULL
        if (!inventory) {
          inventory = await manager.findOne(Inventory, {
            where: {
              product: { id: item.productId },
              variant: IsNull(),
            },
          });
        }

        console.log('Inventory:', inventory);

        if (!inventory) {
          throw new BadRequestException(
            `Không tìm thấy kho cho sản phẩm ${item.productId}`
          );
        }

        if ((inventory.quantity ?? 0) < item.quantity) {
          throw new BadRequestException(
            `Không đủ hàng cho sản phẩm ${item.productId}`
          );
        }

        await manager.save(inventory);

        const orderItem = manager.create(OrderItem, {
          order: savedOrder,
          product,
          variant: item.variantId ? { id: item.variantId } : null,
          quantity: item.quantity,
          price: item.price,
          discount: 0,
          subtotal: item.quantity * item.price,
        });
        await manager.save(orderItem);
      }

      for (const { voucherId } of appliedVouchers) {
        await this.vouchersService.applyVoucher(
          voucherId,
          createOrderDto.userId,
          savedOrder.id
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
    status: OrderStatuses,
    user: User,
    note?: string
  ): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === OrderStatuses.cancelled) {
      throw new BadRequestException('Không thể cập nhật đơn hàng đã bị hủy');
    }

    // Phân quyền cơ bản
    const isCustomer = Number(user.id) === order.user.id;
    const isStore = Number(user.id) === order.store.id;

    if (isCustomer && status !== OrderStatuses.cancelled) {
      throw new BadRequestException('Khách hàng chỉ có thể hủy đơn');
    }
    if (order.status !== OrderStatuses.Pending) {
      throw new BadRequestException(
        'Khách hàng chỉ có thể hủy đơn khi đơn hàng đang chờ'
      );
    }

    if (!isCustomer && !isStore) {
      throw new BadRequestException('Bạn không có quyền thay đổi đơn hàng này');
    }

    const oldStatus = order.status;
    order.status = status;
    const updatedOrder = await this.ordersRepository.save(order);

    // Lưu lịch sử status
    const history = new OrderStatusHistory();
    history.order = updatedOrder;
    history.oldStatus = oldStatus as unknown as historyStatus;
    history.newStatus = status as unknown as historyStatus;
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
        'orderItem',            
        'orderItem.product', 
        'orderItem.product.media',
        'voucherUsages',
        'voucherUsages.voucher',
      ],
    });
  }

  async getRevenue(): Promise<number> {
    const { sum } = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'sum')
      .where('order.status = :status', { status: OrderStatuses.Completed })
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
    return this.ordersRepository.find({
      where: { store: { id: storeId } },
      relations: [
        'user',
        'userAddress',
        'orderItem',
        'orderItem.product',
        'orderItem.variant',
        'voucherUsages',
        'voucherUsages.voucher',
        'payment',
      ],
      order: { id: 'DESC' }, // sắp xếp đơn mới nhất trước
    });
  }
}