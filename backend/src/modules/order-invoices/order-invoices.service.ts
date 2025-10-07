import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderInvoice } from './order-invoice.entity';
import { CreateOrderInvoiceDto } from './dto/create-order-invoice.dto';
import { UpdateOrderInvoiceDto } from './dto/update-order-invoice.dto';

@Injectable()
export class OrderInvoicesService {
  constructor(
    @InjectRepository(OrderInvoice)
    private readonly invoiceRepo: Repository<OrderInvoice>
  ) {}

  async create(dto: CreateOrderInvoiceDto): Promise<OrderInvoice> {
    const invoice = this.invoiceRepo.create({
      ...dto,
      order: { id: dto.orderId } as any,
    });
    return this.invoiceRepo.save(invoice);
  }

  async findAll(): Promise<OrderInvoice[]> {
    return this.invoiceRepo.find({ relations: ['order'] });
  }

  async findOne(id: number): Promise<OrderInvoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }
    return invoice;
  }

  async update(id: number, dto: UpdateOrderInvoiceDto): Promise<OrderInvoice> {
    const invoice = await this.findOne(id);
    Object.assign(invoice, {
      ...dto,
      order: dto.orderId ? ({ id: dto.orderId } as any) : invoice.order,
    });
    return this.invoiceRepo.save(invoice);
  }

  async remove(id: number): Promise<void> {
    const invoice = await this.findOne(id);
    await this.invoiceRepo.remove(invoice);
  }
}
