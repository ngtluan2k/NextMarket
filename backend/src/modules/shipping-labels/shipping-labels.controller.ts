import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ShippingLabelsService } from './shipping-labels.service';
import { CreateShippingLabelDto } from './dto/create-shipping-label.dto';
import { UpdateShippingLabelDto } from './dto/update-shipping-label.dto';

@Controller('shipping-labels')
export class ShippingLabelsController {
  constructor(private readonly shippingLabelsService: ShippingLabelsService) {}

  @Post()
  create(@Body() createShippingLabelDto: CreateShippingLabelDto) {
    return this.shippingLabelsService.create(createShippingLabelDto);
  }

  @Get()
  findAll() {
    return this.shippingLabelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shippingLabelsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShippingLabelDto: UpdateShippingLabelDto
  ) {
    return this.shippingLabelsService.update(+id, updateShippingLabelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shippingLabelsService.remove(+id);
  }
}
