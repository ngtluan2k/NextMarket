import { PartialType } from '@nestjs/mapped-types';
import { CreateAffiliateProgramDto } from './create-affiliate-program.dto';

export class UpdateAffiliateProgramDto extends PartialType(CreateAffiliateProgramDto) {}