import { PartialType } from '@nestjs/swagger';
import { CreateStoreIdentificationDto } from './create-store-identification.dto';

export class UpdateStoreIdentificationDto extends PartialType(CreateStoreIdentificationDto) {}