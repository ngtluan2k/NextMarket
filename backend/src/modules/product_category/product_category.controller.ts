import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductCategoryService } from './product_category.service';
import { CreateProductCategoryDto } from './dto/create-product_category.dto';
import { Req } from '@nestjs/common';
@Controller('product-category')
export class ProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService
  ) {}

  @Post()
async add(@Body() dto: CreateProductCategoryDto, @Req() req: any) {
  const userId = req.user.id;
  return this.productCategoryService.addCategory(dto, userId);
}


}
