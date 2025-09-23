import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrderShipmentsService } from './order-shipments.service';
import { CreateOrderShipmentDto } from './dto/create-order-shipment.dto';
import { UpdateOrderShipmentDto } from './dto/update-order-shipment.dto';

@Controller('order-shipments')
export class OrderShipmentsController {
  constructor(private readonly orderShipmentsService: OrderShipmentsService) {}

  @Post()
  create(@Body() createOrderShipmentDto: CreateOrderShipmentDto) {
    return this.orderShipmentsService.create(createOrderShipmentDto);
  }

  @Get()
  findAll() {
    return this.orderShipmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderShipmentsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderShipmentDto: UpdateOrderShipmentDto
  ) {
    return this.orderShipmentsService.update(+id, updateOrderShipmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderShipmentsService.remove(+id);
  }
}
