import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductMediaService } from './product_media.service';
import { CreateProductMediaDto } from './dto/create-product_media.dto';
import { UpdateProductMediaDto } from './dto/update-product_media.dto';
import { Req } from '@nestjs/common';
@Controller('product-media')
export class ProductMediaController {
  constructor(private readonly productMediaService: ProductMediaService) {}
  @Post()
  async add(@Body() dto: CreateProductMediaDto, @Req() req: any) {
    const userId = req.user.id;
    return this.productMediaService.addMedia(dto, userId);
  }
}
