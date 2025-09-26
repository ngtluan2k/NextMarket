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
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
  return this.ordersRepository.manager.transaction(async (manager) => {
    const user = await manager.findOneBy(User, { id: createOrderDto.userId });
    const store = await manager.findOneBy(Store, { id: createOrderDto.storeId });
    const address = await manager.findOneBy(UserAddress, { id: createOrderDto.addressId });

    if (!user || !store || !address) {
      throw new BadRequestException('User, Store hoặc Address không tồn tại');
    }

    const order = manager.create(Order, {
      status: OrderStatuses.Pending,
      shippingFee: createOrderDto.shippingFee ?? 0,
      discountTotal: createOrderDto.discountTotal ?? 0,
      totalAmount: createOrderDto.totalAmount,
      currency: createOrderDto.currency ?? 'VND',
      user,
      store,
      userAddress: address,
    });

    const savedOrder = await manager.save(order);

    // Insert order items and reserve stock
    for (const item of createOrderDto.items) {
      // validate product exists
      const product = await manager.findOneBy(Product, { id: item.productId });
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} không tồn tại`);
      }

      // find inventory record
      const inventory = await manager.findOne(Inventory, {
        where: {
          product: { id: item.productId },
          variant: item.variantId ? { id: item.variantId } : IsNull(),
        },
      });

      if (!inventory) {
        throw new BadRequestException(`Inventory not found for product ${item.productId}`);
      }

      if ((inventory.quantity ?? 0) < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
      }

      // reserve stock
      inventory.reserved_stock = (inventory.reserved_stock ?? 0) + item.quantity;
      await manager.save(inventory);

      // create order item
      const orderItem = manager.create(OrderItem, {
        order: savedOrder,
        product,
        variant: item.variantId ? ({ id: item.variantId } as any) : null,
        quantity: item.quantity,
        price: item.price,
        discount: 0,
        subtotal: item.quantity * item.price,
      });
      await manager.save(orderItem);
    }

    return savedOrder;
  });
}

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['user', 'store', 'userAddress'],
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user', 'store', 'userAddress'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
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

  async changeStatus(id: number, status: OrderStatuses): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === OrderStatuses.Cancelled) {
      throw new BadRequestException('Cannot update a cancelled order');
    }

    order.status = status;
    return await this.ordersRepository.save(order);
  }

  async findByUser(userId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { user: { id: userId } },
      relations: ['store', 'userAddress'],
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
}