import { Injectable } from '@nestjs/common';
import { CreateShippingLabelDto } from './dto/create-shipping-label.dto';
import { UpdateShippingLabelDto } from './dto/update-shipping-label.dto';

@Injectable()
export class ShippingLabelsService {
  create(createShippingLabelDto: CreateShippingLabelDto) {
    return 'This action adds a new shippingLabel';
  }

  findAll() {
    return `This action returns all shippingLabels`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shippingLabel`;
  }

  update(id: number, updateShippingLabelDto: UpdateShippingLabelDto) {
    return `This action updates a #${id} shippingLabel`;
  }

  remove(id: number) {
    return `This action removes a #${id} shippingLabel`;
  }
}
