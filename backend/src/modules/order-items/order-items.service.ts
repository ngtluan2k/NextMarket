import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { Order } from '../orders/order.entity';
import { Product } from '../product/product.entity';
import { Variant } from '../variant/variant.entity';

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Variant)
    private readonly variantsRepository: Repository<Variant>,
  ) {}

  async create(createOrderItemDto: CreateOrderItemDto): Promise<OrderItem> {
    const order = await this.ordersRepository.findOneBy({
      id: createOrderItemDto.orderId,
    });
    const product = await this.productsRepository.findOneBy({
      id: createOrderItemDto.productId,
    });

    if (!order || !product) {
      throw new BadRequestException('Order hoặc Product không tồn tại');
    }

    let variant: Variant | null = null;
    if (createOrderItemDto.variantId) {
      variant = await this.variantsRepository.findOneBy({
        id: createOrderItemDto.variantId,
      });
      if (!variant) {
        throw new BadRequestException('Variant không tồn tại');
      }
    }

    const orderItem = this.orderItemsRepository.create({
      order,
      product,
      variant: variant ?? null,
      quantity: createOrderItemDto.quantity,
      price: createOrderItemDto.price,
      discount: createOrderItemDto.discount ?? 0,
      subtotal:
        createOrderItemDto.subtotal ??
        createOrderItemDto.quantity * createOrderItemDto.price,
    });

    return await this.orderItemsRepository.save(orderItem);
  }

  async findAll(): Promise<OrderItem[]> {
    return this.orderItemsRepository.find({
      relations: ['order', 'product', 'variant'],
    });
  }

  async findOne(id: number): Promise<OrderItem> {
    const orderItem = await this.orderItemsRepository.findOne({
      where: { id },
      relations: ['order', 'product', 'variant'],
    });

    if (!orderItem) {
      throw new NotFoundException(`OrderItem #${id} không tồn tại`);
    }
    return orderItem;
  }

  async update(
    id: number,
    updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    const orderItem = await this.findOne(id);

    if (updateOrderItemDto.variantId) {
      const variant = await this.variantsRepository.findOneBy({
        id: updateOrderItemDto.variantId,
      });
      if (!variant) {
        throw new BadRequestException('Variant không tồn tại');
      }
      orderItem.variant = variant;
    }

    Object.assign(orderItem, updateOrderItemDto);
    return await this.orderItemsRepository.save(orderItem);
  }

  async remove(id: number): Promise<void> {
    const orderItem = await this.findOne(id);
    await this.orderItemsRepository.remove(orderItem);
  }

  async findByOrder(orderId: number): Promise<OrderItem[]> {
    return this.orderItemsRepository.find({
      where: { order: { id: orderId } },
      relations: ['product', 'variant'],
    });
  }
}
