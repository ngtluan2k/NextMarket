import { PartialType } from '@nestjs/mapped-types';
import { CreateAffiliatePlatformDto } from './create-affiliate-platform.dto';

export class UpdateAffiliatePlatformDto extends PartialType(CreateAffiliatePlatformDto) {}
