import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatusHistory } from './order-status-history.entity';
import { CreateOrderStatusHistoryDto } from './dto/create-order-status-history.dto';
import { UpdateOrderStatusHistoryDto } from './dto/update-order-status-history.dto';
import { Order } from '../orders/order.entity';
import { User } from '../user/user.entity';

@Injectable()
export class OrderStatusHistoryService {
  constructor(
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepository: Repository<OrderStatusHistory>,

    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateOrderStatusHistoryDto): Promise<OrderStatusHistory> {
    const order = await this.ordersRepository.findOneBy({ id: dto.orderId });
    const user = dto.changedById
      ? await this.usersRepository.findOneBy({ id: dto.changedById })
      : null;

    if (!order) {
      throw new BadRequestException('Order không tồn tại');
    }

    const history = this.historyRepository.create({
      order,
      old_status: dto.oldStatus,
      new_status: dto.newStatus,
      note: dto.note,
      changedBy: user || null,
    });

    return await this.historyRepository.save(history);
  }

  async findAll(): Promise<OrderStatusHistory[]> {
    return this.historyRepository.find({ relations: ['order', 'changedBy'] });
  }

  async findOne(id: number): Promise<OrderStatusHistory> {
    const history = await this.historyRepository.findOne({
      where: { id },
      relations: ['order', 'changedBy'],
    });
    if (!history) {
      throw new NotFoundException(`OrderStatusHistory #${id} không tồn tại`);
    }
    return history;
  }

  async update(
    id: number,
    dto: UpdateOrderStatusHistoryDto,
  ): Promise<OrderStatusHistory> {
    const history = await this.findOne(id);

    if (dto.changedById) {
      const user = await this.usersRepository.findOneBy({ id: dto.changedById });
      if (!user) throw new BadRequestException('User không tồn tại');
      history.changedBy = user;
    }

    Object.assign(history, dto);
    return await this.historyRepository.save(history);
  }

  async remove(id: number): Promise<void> {
    const history = await this.findOne(id);
    await this.historyRepository.remove(history);
  }
}
