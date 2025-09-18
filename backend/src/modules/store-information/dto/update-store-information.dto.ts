import { PartialType } from '@nestjs/swagger';
import { CreateStoreInformationDto } from './create-store-information.dto';

export class UpdateStoreInformationDto extends PartialType(
  CreateStoreInformationDto
) {}
