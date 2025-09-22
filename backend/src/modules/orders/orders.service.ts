import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatuses } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../user/user.entity';
import { Store } from '../store/store.entity';
import { UserAddress } from '../user_address/user_address.entity';

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
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const user = await this.usersRepository.findOneBy({ id: createOrderDto.userId });
    const store = await this.storesRepository.findOneBy({ id: createOrderDto.storeId });
    const address = await this.addressesRepository.findOneBy({ id: createOrderDto.addressId });

    if (!user || !store || !address) {
      throw new BadRequestException('User, Store hoặc Address không tồn tại');
    }

    const order = this.ordersRepository.create({
      status: OrderStatuses.Pending,
      shippingFee: createOrderDto.shippingFee,
      discountTotal: createOrderDto.discountTotal,
      totalAmount: createOrderDto.totalAmount,
      currency: createOrderDto.currency ?? 'VND',
      user,
      store,
      userAddress: address,
    });

    return await this.ordersRepository.save(order);
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
