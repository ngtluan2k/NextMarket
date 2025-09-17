import { PartialType } from '@nestjs/swagger';
import { CreateUserAddressDto } from './create-user_address.dto';

export class UpdateUserAddressDto extends PartialType(CreateUserAddressDto) {}
