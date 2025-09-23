import { PartialType } from '@nestjs/swagger';
import { CreateShippingLabelDto } from './create-shipping-label.dto';

export class UpdateShippingLabelDto extends PartialType(
  CreateShippingLabelDto
) {}
