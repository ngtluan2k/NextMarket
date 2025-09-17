import { PartialType } from '@nestjs/swagger';
import { CreateVoucherDto } from './create-vouchers.dto';

export class UpdateVoucherDto extends PartialType(CreateVoucherDto) {}
