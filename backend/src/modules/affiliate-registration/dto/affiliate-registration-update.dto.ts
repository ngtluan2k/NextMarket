import { PartialType } from '@nestjs/mapped-types';
import { CreateAffiliateRegistrationDto } from './affiliate-registration-create.dto';

export class UpdateAffiliateRegistrationDto extends PartialType(CreateAffiliateRegistrationDto) {}
