import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VoucherCollectionService } from './voucher-collection.service';
import { CreateVoucherCollectionDto } from './dto/create-voucher-collection.dto';
import { UpdateVoucherCollectionDto } from './dto/update-voucher-collection.dto';

@Controller('voucher-collection')
export class VoucherCollectionController {
  constructor(
    private readonly voucherCollectionService: VoucherCollectionService
  ) {}

  @Post()
  create(@Body() createVoucherCollectionDto: CreateVoucherCollectionDto) {
    return this.voucherCollectionService.create(createVoucherCollectionDto);
  }

  @Get()
  findAll() {
    return this.voucherCollectionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.voucherCollectionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVoucherCollectionDto: UpdateVoucherCollectionDto
  ) {
    return this.voucherCollectionService.update(
      +id,
      updateVoucherCollectionDto
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.voucherCollectionService.remove(+id);
  }
}
