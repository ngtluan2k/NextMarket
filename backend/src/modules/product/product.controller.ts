import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { NotFoundException } from '@nestjs/common/exceptions';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getAllProduct() {
    return this.productService.findAllProduct();
  }


  // Lấy tất cả sản phẩm của store
  @UseGuards(JwtAuthGuard)
  @Get('store')
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    return this.productService.findAll(userId);
  }

  // Lấy 1 sản phẩm theo id
@Get('store/:id')
async findOne(@Param('id') id: number, @Req() req: any) {
  const userId = req.user.id;
  return this.productService.findOne(id, userId);
}

  // Tạo sản phẩm (draft)
 @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    const userId = req.user.id; // đảm bảo req.user đã có
    return this.productService.createProduct(dto, userId);
  }

  

  // Cập nhật sản phẩm
  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: CreateProductDto, @Req() req: any) {
    const userId = req.user.id;
    return this.productService.updateProduct(id, dto, userId);
  }

  // Xóa sản phẩm
  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.productService.remove(id, userId);
  }

  // Publish sản phẩm (đăng lên store)
  @Post(':id/publish')
  async publishDraft(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;

    // Lấy sản phẩm hiện tại
    const product = await this.productService.findOne(id, userId);
    if (!product) throw new NotFoundException('Product not found');

    // Publish bằng cách lưu lại với status 'active'
    return this.productService.saveProduct(product as any, userId, 'active');
  }

  @Post('publish')
@UseGuards(JwtAuthGuard)
async publish(@Body() dto: CreateProductDto, @Req() req: any) {
  const userId = req.user.id;
  return this.productService.publishProduct(dto, userId);
}

@Get('slug/:slug')
async getProductBySlug(@Param('slug') slug: string) {
  const data = await this.productService.findBySlug(slug);
  return {
    message: 'Lấy chi tiết sản phẩm thành công',
    data,
  };
}
}
