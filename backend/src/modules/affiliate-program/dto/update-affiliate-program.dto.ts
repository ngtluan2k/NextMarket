import { PartialType } from '@nestjs/swagger';
import { CreateAffiliateProgramDto } from './create-affiliate-program.dto';

export class UpdateAffiliateProgramDto extends PartialType(
  CreateAffiliateProgramDto
) {}
