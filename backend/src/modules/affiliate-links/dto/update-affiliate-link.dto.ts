import { PartialType } from '@nestjs/mapped-types';
import { CreateAffiliateLinkDto } from './create-affiliate-link.dto';

export class UpdateAffiliateLinkDto extends PartialType(
  CreateAffiliateLinkDto
) {}
