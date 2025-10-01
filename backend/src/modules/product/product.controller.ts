import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseInterceptors,
  UploadedFiles,
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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { FilesInterceptor } from '@nestjs/platform-express';

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
  @Get('search')
  async search(@Query('q') q: string) {
    const products = await this.productService.searchProducts(q);
    return { data: products }; // phải trả về object { data: [...] }
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


  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/products';
          if (!existsSync(uploadPath))
            mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    })
  )
  @Post()
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: any, // dùng any vì các trường JSON gửi qua FormData là string
    @Req() req: any
  ) {
    // Parse các trường JSON từ FormData
    if (dto.variants) dto.variants = JSON.parse(dto.variants);
    if (dto.inventory) dto.inventory = JSON.parse(dto.inventory);
    if (dto.pricing_rules) dto.pricing_rules = JSON.parse(dto.pricing_rules);
    if (dto.categories) dto.categories = JSON.parse(dto.categories);

    // Chuyển file thành media metadata
    if (files?.length) {
      dto.media = files.map((file, index) => ({
        file_name: file.filename,
        media_type: 'image',
        is_primary: index === 0,
        url: `/uploads/products/${file.filename}`,
      }));
    }

    const userId = req.user.sub;
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
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.id;
    return this.productService.removeProduct(id, userId);
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
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/products';
          if (!existsSync(uploadPath))
            mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    })
  )
  async publish(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: any, // dùng any vì các trường JSON gửi qua FormData là string
    @Req() req: any
  ) {
    // Parse các trường JSON từ FormData
    if (dto.variants) dto.variants = JSON.parse(dto.variants);
    if (dto.inventory) dto.inventory = JSON.parse(dto.inventory);
    if (dto.pricing_rules) dto.pricing_rules = JSON.parse(dto.pricing_rules);
    if (dto.categories) dto.categories = JSON.parse(dto.categories);

    // Chuyển file thành media metadata
    if (files?.length) {
      dto.media = files.map((file, index) => ({
        file_name: file.filename,
        media_type: 'image',
        is_primary: index === 0,
        url: `/uploads/products/${file.filename}`,
      }));
    }

    const userId = req.user.sub;
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

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard)
  async toggleStatus(@Param('id') id: number, @Req() req: any) {
    const userId = req.user.sub;
    return this.productService.toggleProductStatus(id, userId);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar products based on tags' })
  async getSimilarProducts(@Param('id') id: number) {
    const products = await this.productService.findSimilarProducts(id);
    return {
      message: 'Similar products retrieved successfully',
      data: products,
    };
  }

  @Put(':id')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  FilesInterceptor('media', 10, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/products';
        if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }),
)
async updateDraft(
  @Param('id') id: number,
  @UploadedFiles() files: Express.Multer.File[],
  @Body() dto: any,
  @Req() req: any,
) {
  // --- Parse JSON từ FormData và chuẩn hóa thành array ---
  dto.variants = dto.variants ? JSON.parse(dto.variants) : [];
  dto.inventory = dto.inventory ? JSON.parse(dto.inventory) : [];
  dto.pricing_rules = dto.pricing_rules ? JSON.parse(dto.pricing_rules) : [];
  dto.categories = dto.categories ? JSON.parse(dto.categories) : [];
  dto.media_meta = dto.media_meta ? JSON.parse(dto.media_meta) : [];

  // --- Merge media_meta + files mới ---
  dto.media = dto.media_meta.map((m: any) => ({
    ...m,
    url: m.url ? m.url.replace(/^https?:\/\/[^/]+/, '') : '', // chuyển URL cũ thành relative
  }));

  if (files?.length) {
    files.forEach((file) => {
      dto.media.push({
        file_name: file.filename,
        media_type: 'image',
        is_primary: false,
        url: `/uploads/products/${file.filename}`,
        sort_order: dto.media.length + 1,
      });
    });
  }

  // --- Gọi service update ---
  const userId = req.user.sub;
  return this.productService.updateProduct(id, dto, userId);
}


@Put(':id/publish')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  FilesInterceptor('media', 10, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = './uploads/products';
        if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  })
)
async updateAndPublish(
  @Param('id') id: number,
  @UploadedFiles() files: Express.Multer.File[],
  @Body() dto: any,
  @Req() req: any
) {
  // Parse JSON từ FormData
  if (dto.variants) dto.variants = JSON.parse(dto.variants);
  if (dto.inventory) dto.inventory = JSON.parse(dto.inventory);
  if (dto.pricing_rules) dto.pricing_rules = JSON.parse(dto.pricing_rules);
  if (dto.categories) dto.categories = JSON.parse(dto.categories);

  if (files?.length) {
    dto.media = files.map((file, index) => ({
      file_name: file.filename,
      media_type: 'image',
      is_primary: index === 0,
      url: `/uploads/products/${file.filename}`,
    }));
  }

  const userId = req.user.sub;
  return this.productService.updateAndPublishProduct(id, dto, userId);
}
}
