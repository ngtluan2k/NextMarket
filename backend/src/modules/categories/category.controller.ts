import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
@ApiBearerAuth('access-token')
@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Get()
  // @Permissions('view_category')
  async findAll(@Query('search') search?: string) {
    const data = await this.categoryService.findAll(search);
    console.log('data: ', JSON.stringify(data));
    return {
      message: 'Lấy danh sách category thành công',
      total: data.length,
      data,
    };
  }

  // @Get(':id')
  // // @Permissions('view_category')
  // async findOne(@Param('id') id: number) {
  //   const data = await this.categoryService.findOne(id);
  //   return {
  //     message: data ? 'Lấy category thành công' : 'Không tìm thấy category',
  //     data,
  //   };
  // }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('create_category')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/categories';
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
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateCategoryDto
  ) {
    if (file) {
      dto.image = `/uploads/categories/${file.filename}`; // thêm field image_url
    }
    const data = await this.categoryService.create(dto);
    return {
      message: 'Tạo category thành công',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('update_category')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/categories';
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
  async update(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateCategoryDto
  ) {
    // nếu có file mới thì gán path
    if (file) {
      dto.image = `/uploads/categories/${file.filename}`;
    }

    const data = await this.categoryService.update(id, dto);
    return {
      message: 'Cập nhật category thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('delete_category')
  async remove(@Param('id') id: number) {
    await this.categoryService.remove(id);
    return {
      message: 'Xóa category thành công',
    };
  }

  @Get(':slug/products')
  async findProductsBySlug(@Param('slug') slug: string) {
    const data = await this.categoryService.findProductsBySlug(slug);
    return {
      message: data.length
        ? `Lấy danh sách sản phẩm trong category ${slug} thành công`
        : 'Không có sản phẩm nào trong category này',
      total: data.length,
      data,
    };
  }

  @Get(':slug/brands')
  async getBrands(@Param('slug') slug: string) {
    return await this.categoryService.findBrandsByCategorySlug(slug);
  }

  @Get(':id/children')
  async findChildren(@Param('id') id: number) {
    const children = await this.categoryService.findChildren(id);
    return {
      message: children.length
        ? `Lấy danh sách category con của category ${id} thành công`
        : 'Category này không có danh mục con',
      total: children.length,
      data: children,
    };
  }
}
