import {
  Controller,
  Get,
  Query,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  ParseIntPipe,
  NotFoundException,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductService } from '../product/product.service';
import { Store } from './store.entity';
import { Repository } from 'typeorm';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { multerConfig } from '../../common/utils/multer.config';

@ApiTags('stores')
@ApiBearerAuth('access-token')
@Controller('stores')
export class StoreController {
  constructor(
    private readonly productService: ProductService,
    private readonly storeService: StoreService,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('view_store')
  @ApiOperation({ summary: 'Lấy danh sách tất cả stores' })
  async findAll(@Query('includeDeleted') includeDeleted?: string) {
    const stores = await this.storeService.findAll(includeDeleted === 'true');
    return {
      message: 'Danh sách cửa hàng',
      total: stores.length,
      data: stores,
    };
  }

  @Get('my-store')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy store của tôi' })
  async getMyStore(
    @Req() req: any,
    @Query('includeDeleted') includeDeleted?: string
  ) {
    const store = await this.storeService.findByUserId(
      req.user.userId,
      includeDeleted === 'true'
    );
    return {
      message: store ? 'Thông tin store của bạn' : 'Bạn chưa có store',
      data: store,
    };
  }

  @Get(':id/draft-data')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy đầy đủ draft data của store' })
  async getDraftData(@Param('id') id: string, @Req() req: any) {
    const draftData = await this.storeService.getFullDraftData(
      parseInt(id),
      req.user.userId
    );
    return {
      message: 'Draft data của store',
      data: draftData,
    };
  }

  @Get('check-seller')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Kiểm tra có phải seller không' })
  async checkSeller(@Req() req: any) {
    const isSeller = await this.storeService.isUserSeller(req.user.userId);
    return {
      message: 'Trạng thái seller',
      data: { is_seller: isSeller },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin store theo ID' })
  async findOne(@Param('id') id: number) {
    const store = await this.storeService.findOne(id);
    return {
      message: 'Chi tiết cửa hàng',
      data: store,
    };
  }
  @Get(':id/full')
  @ApiOperation({
    summary: 'Lấy đầy đủ thông tin cửa hàng và các dữ liệu liên quan',
  })
  async getFull(@Param('id') id: number) {
    const data = await this.storeService.getFullData(id);
    return {
      message: 'Chi tiết đầy đủ cửa hàng',
      data,
    };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Lấy thống kê store' })
  async getStoreStats(@Param('id') id: number) {
    const stats = await this.storeService.getStoreStats(id);
    return {
      message: 'Thống kê cửa hàng',
      data: stats,
    };
  }

  @Post('register-seller')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đăng ký làm người bán hàng' })
  async registerSeller(@Req() req: any, @Body() dto: RegisterSellerDto) {
    const result = await this.storeService.registerSeller(req.user.userId, dto);
    return {
      message: result.message,
      data: result.store,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('create_store')
  @ApiOperation({ summary: 'Tạo store mới' })
  async create(@Req() req: any, @Body() dto: CreateStoreDto) {
    const store = await this.storeService.create(req.user.userId, dto);
    return {
      message: 'Tạo cửa hàng thành công',
      data: store,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('update_store')
  @ApiOperation({ summary: 'Cập nhật store' })
  async update(@Param('id') id: number, @Body() dto: UpdateStoreDto) {
    const store = await this.storeService.update(id, dto);
    return {
      message: 'Cập nhật cửa hàng thành công',
      data: store,
    };
  }

  @Delete('my-store')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Seller xóa cửa hàng của chính mình' })
  async deleteMyStore(@Req() req: any) {
    const result = await this.storeService.deleteMyStore(req.user.userId);
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('delete_store')
  @ApiOperation({ summary: 'Admin xóa store và toàn bộ dữ liệu liên quan' })
  async remove(@Param('id') id: number) {
    const result = await this.storeService.remove(id);
    return result;
  }

  // @Get('owner/:userId')
  // @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions('view_own_store') // for all store have owned
  // async getStoresByUserId(@Param('userId') userId: string, @Req() req: any) {
  //   console.log('Request URL:', req.url);
  //   console.log('userId:', userId);
  //   console.log('req.user:', req.user);
  //   const targetUserId = parseInt(userId, 10);
  //   console.log('targetUserId:', targetUserId);
  //   if (isNaN(targetUserId)) {
  //     throw new BadRequestException('User ID không hợp lệ');
  //   }
  //   const currentUserId = req.user?.userId;
  //   console.log('currentUserId:', currentUserId);
  //   if (!currentUserId || isNaN(currentUserId)) {
  //     throw new BadRequestException('User ID không hợp lệ');
  //   }
  //   if (currentUserId !== targetUserId) {
  //     throw new ForbiddenException(
  //       'Bạn không có quyền xem cửa hàng của user khác'
  //     );
  //   }
  //   const stores = await this.storeService.findStoresByUserId(targetUserId);
  //   return {
  //     message: 'Danh sách cửa hàng của user',
  //     total: stores.length,
  //     data: stores,
  //   };
  // }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Lấy thông tin store theo slug' })
  async findBySlug(@Param('slug') slug: string) {
    const store = await this.storeService.findBySlug(slug);
    if (!store) {
      throw new BadRequestException('Store không tồn tại');
    }
    return {
      message: 'Chi tiết cửa hàng theo slug',
      data: store,
    };
  }

  @Get('slug/:slug/all')
  @ApiOperation({ summary: 'Lấy tất cả sản phẩm của store theo slug' })
  async getStoreProducts(
    @Param('slug') slug: string,
    @Query('category') categorySlug?: string
  ) {
    const store = await this.storeService.findProductsBySlug(
      slug,
      categorySlug
    );
    if (!store) {
      throw new BadRequestException('Store không tồn tại');
    }

    // Nếu muốn chỉ lấy sản phẩm đang active
    const products = store.products.filter((p) => p.status === 'active');

    return {
      message: `Danh sách sản phẩm của store ${store.name}`,
      total: products.length,
      data: products,
    };
  }

  @Get('slug/:slug/profile')
  @ApiOperation({ summary: 'Lấy profile cửa hàng theo slug' })
  async getStoreProfile(@Param('slug') slug: string) {
    const store = await this.storeService.findBySlug(slug);
    if (!store) {
      throw new BadRequestException('Store không tồn tại');
    }
    const productCount = await this.productService.countByStoreId(store.id);

    // Tính số lượng follower
    const followerCount = store.followers ? store.followers.length : 0;

    const profileData = {
      id: store.id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      logo_url: store.logo_url,
      email: store.email,
      phone: store.phone,
      status: store.status,
      created_at: store.created_at,
      updated_at: store.updated_at,
      avg_rating: store.avg_rating,
      review_count: store.review_count,
      totalProducts: productCount,
      followerCount, // dùng số lượng thay vì mảng
    };

    return {
      message: `Thông tin profile của store ${store.name}`,
      data: profileData,
    };
  }

  @Get('slug/:slug/categories')
  async getStoreCategories(@Param('slug') slug: string) {
    const store = await this.storeRepo.findOne({ where: { slug } });
    if (!store) throw new NotFoundException('Store not found');

    const categories = await this.storeService.findCategoriesByStoreWithCount(
      store.id
    );
    return {
      message: `Danh mục sản phẩm của store ${store.name}`,
      total: categories.length,
      data: categories,
    };
  }

  @Put(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('restore_store')
  @ApiOperation({ summary: 'Admin khôi phục store đã xóa mềm' })
  async restore(@Param('id') id: number) {
    const result = await this.storeService.restore(id);
    return result;
  }
  @Post(':id/upload-logo')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload store logo (owner only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.storeService.uploadLogo(
      id,
      file,
      req.user.userId
    );
    return { message: 'Logo uploaded', data: result };
  }
}
