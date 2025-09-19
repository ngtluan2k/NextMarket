import { Injectable } from '@nestjs/common';
import { CreateOrderShipmentDto } from './dto/create-order-shipment.dto';
import { UpdateOrderShipmentDto } from './dto/update-order-shipment.dto';

@Injectable()
export class OrderShipmentsService {
  create(createOrderShipmentDto: CreateOrderShipmentDto) {
    return 'This action adds a new orderShipment';
  }

  findAll() {
    return `This action returns all orderShipments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} orderShipment`;
  }

  update(id: number, updateOrderShipmentDto: UpdateOrderShipmentDto) {
    return `This action updates a #${id} orderShipment`;
  }

  remove(id: number) {
    return `This action removes a #${id} orderShipment`;
  }
}
