import { PartialType } from '@nestjs/swagger';
import { CreateProductMediaDto } from './create-product_media.dto';

export class UpdateProductMediaDto extends PartialType(CreateProductMediaDto) {}
