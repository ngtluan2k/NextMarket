import { Controller, Get, Post, Body, UseGuards, Param, Put, Delete } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { Req } from '@nestjs/common';
@ApiBearerAuth('access-token')
@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Permissions('view_product')
  async findAll() {
    const products = await this.productService.findAll();
    return {
      message: 'Lấy danh sách sản phẩm thành công',
      total: products.length,
      data: products,
    };
  }

  @Get(':id')
  @Permissions('view_product')
  async findOne(@Param('id') id: number){
    const data = await this.productService.findOne(id)
    return data
  }


  @Post()
  @Permissions('create_product')
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    const userId = req.user.id; // JWT payload đã decode
    return this.productService.createProduct(dto, userId);
  }

@Put(':id')
@Permissions('update_product')
async update(
  @Param('id') id: number,
  @Body() dto: UpdateProductDto,
  @Req() req: any,
) {
  const userId = req.user.id; // lấy từ JWT payload
  return this.productService.update(id, dto, userId);
}


  @Delete(':id')
  @Permissions('delete_product')
  async remove(@Param('id') id :number){
    await this.productService.remove(id)
  return {
    message: 'Xóa sản phẩm thành công',
  };  
}
}
