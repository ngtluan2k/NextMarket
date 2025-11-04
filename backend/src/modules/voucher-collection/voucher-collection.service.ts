import { Injectable } from '@nestjs/common';
import { CreateVoucherCollectionDto } from './dto/create-voucher-collection.dto';
import { UpdateVoucherCollectionDto } from './dto/update-voucher-collection.dto';

@Injectable()
export class VoucherCollectionService {
  create(createVoucherCollectionDto: CreateVoucherCollectionDto) {
    return 'This action adds a new voucherCollection';
  }

  findAll() {
    return `This action returns all voucherCollection`;
  }

  findOne(id: number) {
    return `This action returns a #${id} voucherCollection`;
  }

  update(id: number, updateVoucherCollectionDto: UpdateVoucherCollectionDto) {
    return `This action updates a #${id} voucherCollection`;
  }

  remove(id: number) {
    return `This action removes a #${id} voucherCollection`;
  }
}
