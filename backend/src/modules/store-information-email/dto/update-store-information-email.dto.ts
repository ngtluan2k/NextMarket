import { PartialType } from '@nestjs/swagger';
import { CreateStoreInformationEmailDto }  from './create-store-information-email.dto';

export class UpdateStoreIdentificationDto extends PartialType(CreateStoreInformationEmailDto) {}