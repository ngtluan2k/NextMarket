// update-flash-sale-schedule.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateFlashSaleScheduleDto } from './create-flash_sale_schedule.dto';

export class UpdateFlashSaleScheduleDto extends PartialType(CreateFlashSaleScheduleDto) {}
