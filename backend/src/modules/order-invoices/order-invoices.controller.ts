import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrderInvoicesService } from './order-invoices.service';
import { CreateOrderInvoiceDto } from './dto/create-order-invoice.dto';
import { UpdateOrderInvoiceDto } from './dto/update-order-invoice.dto';

@Controller('order-invoices')
export class OrderInvoicesController {
  constructor(private readonly orderInvoicesService: OrderInvoicesService) {}

  @Post()
  create(@Body() createOrderInvoiceDto: CreateOrderInvoiceDto) {
    return this.orderInvoicesService.create(createOrderInvoiceDto);
  }

  @Get()
  findAll() {
    return this.orderInvoicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderInvoicesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderInvoiceDto: UpdateOrderInvoiceDto
  ) {
    return this.orderInvoicesService.update(+id, updateOrderInvoiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderInvoicesService.remove(+id);
  }
}
