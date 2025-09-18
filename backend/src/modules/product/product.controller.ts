import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { StoreService } from '../store/store.service';
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly storeService: StoreService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả sản phẩm (public)' })
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
  @Get(':id')
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
  async update(
    @Param('id') id: number,
    @Body() dto: CreateProductDto,
    @Req() req: any
  ) {
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

  @UseGuards(JwtAuthGuard)
  @Get('store/:storeId')
  @ApiOperation({
    summary: 'Lấy tất cả sản phẩm của store theo storeId (chỉ chủ store)',
  })
  async findByStoreId(@Param('storeId') storeId: number, @Req() req: any) {
    console.log('req.user:', JSON.stringify(req.user)); // Debug log
    const userId = req.user?.userId; // Use userId
    console.log('Extracted userId:', userId);
    console.log('Requested storeId:', storeId);
    if (!userId)
      throw new UnauthorizedException(
        'Không tìm thấy thông tin người dùng trong token'
      );
    const store = await this.storeService.findOne(storeId);
    if (!store) throw new NotFoundException('Store not found');
    console.log('Store user_id:', store.user_id);
    if (store.user_id !== parseInt(userId)) {
      throw new ForbiddenException(
        'Bạn không có quyền xem sản phẩm của store này'
      );
    }

    const products = await this.productService.findAllByStoreId(storeId);
    return {
      message: 'Danh sách sản phẩm của store',
      total: products.length,
      data: products,
    };
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
