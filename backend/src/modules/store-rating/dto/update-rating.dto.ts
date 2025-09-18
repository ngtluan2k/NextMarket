import { PartialType } from '@nestjs/swagger';
import { RateStoreDto } from './rate-store.dto';

export class UpdateRatingDto extends PartialType(RateStoreDto) {}
