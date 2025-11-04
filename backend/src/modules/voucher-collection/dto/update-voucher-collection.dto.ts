import { PartialType } from '@nestjs/swagger';
import { CreateVoucherCollectionDto } from './create-voucher-collection.dto';

export class UpdateVoucherCollectionDto extends PartialType(
  CreateVoucherCollectionDto
) {}
