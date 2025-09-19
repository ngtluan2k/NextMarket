import { PartialType } from '@nestjs/swagger';
import { CreateOrderInvoiceDto } from './create-order-invoice.dto';

export class UpdateOrderInvoiceDto extends PartialType(CreateOrderInvoiceDto) {}
