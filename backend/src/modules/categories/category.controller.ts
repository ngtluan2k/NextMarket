import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PermissionGuard } from '../../common/auth/permission.guard';
import { RequirePermissions as Permissions } from '../../common/auth/permission.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiBearerAuth('access-token')
@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService
  ) {}
  @Get()
  // @Permissions('view_category')
  async findAll(@Query('search') search?: string) {
    const data = await this.categoryService.findAll(search);
    return {
      message: 'Lấy danh sách category thành công',
      total: data.length,
      data,
    };
  }

@Get(':id')
  // @Permissions('view_category')
  async findOne(@Param('id') id: number) {
    const data = await this.categoryService.findOne(id);
    return {
      message: data ? 'Lấy category thành công' : 'Không tìm thấy category',
      data,
    };
  }

@Post()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permissions('create_category')
async create(@Body() dto: CreateCategoryDto) {
  const data = await this.categoryService.create(dto);
  return {
    message: 'Tạo category thành công',
    data,
  };
}

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('update_category')
  async update(@Param('id') id: number, @Body() dto: UpdateCategoryDto) {
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
